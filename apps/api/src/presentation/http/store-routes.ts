import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { db, schema } from '@white-label/db'
import { eq } from 'drizzle-orm'
import { requireAuth } from '../../infra/http/middlewares/auth'
import { tenantMiddleware } from '../../infra/http/middlewares/tenant'
import { createStoreUseCase } from '../../application/stores/use-cases/create-store'
import { updateStoreLogoUseCase } from '../../application/stores/use-cases/update-store-logo'
import { updateStoreBannerUseCase } from '../../application/stores/use-cases/update-store-banner'
import { updateStorePreferencesUseCase } from '../../application/stores/use-cases/update-store-preferences'
import { randomUUID } from 'crypto'
import { UserRepository } from '../../infra/db/repositories/user-repository'
import { AuthSessionRepository } from '../../infra/db/repositories/auth-session-repository'

export async function registerStoreRoutes(app: FastifyInstance): Promise<void> {
  const userRepository = new UserRepository()
  const authSessionRepository = new AuthSessionRepository()

  const jwtSign = async (payload: {
    sub: string
    storeId?: string
    role?: string
  }): Promise<string> => {
    if (!app.jwt) {
      throw new Error('JWT is not configured. Please set JWT_ACCESS_SECRET in .env file')
    }
    try {
      return app.jwt.sign(payload)
    } catch (error) {
      throw new Error(`JWT sign error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
  // Endpoint público para buscar tema da loja (usado pela aplicação web)
  app.get(
    '/stores/theme/public',
    {
      onRequest: [tenantMiddleware]
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const storeId = (request as any).storeId as string | undefined

        if (!storeId) {
          await reply.code(400).send({ error: 'Store ID is required' })
          return
        }

        const themeConfig = await db
          .select()
          .from(schema.storeThemeConfig)
          .where(eq(schema.storeThemeConfig.store_id, storeId))
          .limit(1)

        if (themeConfig.length === 0) {
          await reply.send({
            logo_url: null,
            banner_url: null,
            primary_color: null,
            secondary_color: null,
            text_color: null,
            icon_color: null
          })
          return
        }

        await reply.send({
          logo_url: themeConfig[0].logo_url,
          banner_url: themeConfig[0].banner_url,
          primary_color: themeConfig[0].primary_color,
          secondary_color: themeConfig[0].secondary_color,
          text_color: themeConfig[0].text_color,
          icon_color: themeConfig[0].icon_color
        })
      } catch (error) {
        request.log.error(error)
        await reply.code(500).send({ error: 'Internal server error' })
      }
    }
  )

  // Endpoint público para buscar storeId por domain (usado pelo admin no login)
  app.get<{
    Querystring: {
      domain?: string
    }
  }>(
    '/stores/by-domain',
    async (
      request: FastifyRequest<{
        Querystring: {
          domain?: string
        }
      }>,
      reply: FastifyReply
    ) => {
      try {
        const domain = request.query.domain || 'localhost'

        const stores = await db
          .select({
            id: schema.stores.id,
            name: schema.stores.name,
            active: schema.stores.active
          })
          .from(schema.stores)
          .where(eq(schema.stores.domain, domain))
          .limit(1)

        if (stores.length === 0) {
          await reply.code(404).send({
            error: 'Store not found',
            message: `Nenhuma loja encontrada com domain: ${domain}`
          })
          return
        }

        const store = stores[0]

        if (!store.active) {
          await reply.code(404).send({
            error: 'Store not found',
            message: 'Loja encontrada mas está inativa'
          })
          return
        }

        await reply.send({
          storeId: store.id,
          name: store.name,
          domain: domain
        })
      } catch (error) {
        request.log.error(error)
        await reply.code(500).send({ error: 'Internal server error' })
      }
    }
  )

  // Endpoint para criar store (onboarding)
  app.post<{ Body: { name: string; domain: string } }>(
    '/stores',
    {
      onRequest: [requireAuth]
    },
    async (
      request: FastifyRequest<{ Body: { name: string; domain: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const userId = (request.user as { id: string } | undefined)?.id

        if (!userId) {
          await reply.code(401).send({ error: 'Not authenticated' })
          return
        }

        const { name, domain } = request.body

        if (!name || !domain) {
          await reply.code(400).send({ error: 'Name and domain are required' })
          return
        }

        // Validar formato do domain (deve ser um slug válido)
        const domainRegex = /^[a-z0-9-]+$/
        if (!domainRegex.test(domain)) {
          await reply.code(400).send({ error: 'Domain must be a valid slug (lowercase letters, numbers, and hyphens only)' })
          return
        }

        const result = await createStoreUseCase({ name, domain }, userId)

        // Buscar usuário atualizado com store
        const userWithStore = await userRepository.findByIdWithStore(userId)
        if (!userWithStore || !userWithStore.store_id || !userWithStore.role || !userWithStore.store) {
          await reply.code(500).send({ error: 'Failed to retrieve user after store creation' })
          return
        }

        // Gerar tokens para a nova store
        const accessToken = await jwtSign({
          sub: userId,
          storeId: result.store.id,
          role: userWithStore.role
        })

        const refreshToken = randomUUID()
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + 30)

        await authSessionRepository.createSession({
          user_id: userId,
          store_id: result.store.id,
          refresh_token: refreshToken,
          expires_at: expiresAt
        })

        const isProduction = process.env.NODE_ENV === 'production'

        reply.setCookie('refreshToken', refreshToken, {
          httpOnly: true,
          sameSite: 'lax',
          secure: isProduction,
          path: '/',
          maxAge: 60 * 60 * 24 * 30
        })

        await reply.send({
          store: result.store,
          accessToken,
          user: {
            id: userWithStore.id,
            email: userWithStore.email,
            name: userWithStore.name,
            role: userWithStore.role,
            storeId: result.store.id,
            store: userWithStore.store
          }
        })
      } catch (error) {
        if (error instanceof Error) {
          const statusCode = error.message === 'Domain already in use' ? 409 : 500
          await reply.code(statusCode).send({ error: error.message })
          return
        }
        await reply.code(500).send({ error: 'Internal server error' })
      }
    }
  )

  // Endpoint para buscar configuração de tema da loja
  app.get(
    '/stores/theme',
    {
      onRequest: [requireAuth, tenantMiddleware]
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const storeId = (request as any).storeId as string | undefined

        if (!storeId) {
          await reply.code(400).send({ error: 'Store ID is required' })
          return
        }

        const themeConfig = await db
          .select()
          .from(schema.storeThemeConfig)
          .where(eq(schema.storeThemeConfig.store_id, storeId))
          .limit(1)

        if (themeConfig.length === 0) {
          await reply.send({
            logo_url: null,
            banner_url: null,
            primary_color: null,
            secondary_color: null,
            text_color: null,
            icon_color: null
          })
          return
        }

        await reply.send({
          logo_url: themeConfig[0].logo_url,
          banner_url: themeConfig[0].banner_url,
          primary_color: themeConfig[0].primary_color,
          secondary_color: themeConfig[0].secondary_color,
          text_color: themeConfig[0].text_color,
          icon_color: themeConfig[0].icon_color
        })
      } catch (error) {
        request.log.error(error)
        await reply.code(500).send({ error: 'Internal server error' })
      }
    }
  )

  // Endpoint para buscar preferências da loja
  app.get(
    '/stores/preferences',
    {
      onRequest: [requireAuth, tenantMiddleware]
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const storeId = (request as any).storeId as string | undefined

        if (!storeId) {
          await reply.code(400).send({ error: 'Store ID is required' })
          return
        }

        const themeConfig = await db
          .select()
          .from(schema.storeThemeConfig)
          .where(eq(schema.storeThemeConfig.store_id, storeId))
          .limit(1)

        if (themeConfig.length === 0) {
          await reply.send({
            logo_url: null,
            primary_color: null,
            secondary_color: null,
            text_color: null,
            icon_color: null
          })
          return
        }

        await reply.send({
          logo_url: themeConfig[0].logo_url,
          primary_color: themeConfig[0].primary_color,
          secondary_color: themeConfig[0].secondary_color,
          text_color: themeConfig[0].text_color,
          icon_color: themeConfig[0].icon_color
        })
      } catch (error) {
        request.log.error(error)
        await reply.code(500).send({ error: 'Internal server error' })
      }
    }
  )

  // Endpoint para atualizar preferências da loja
  app.put<{ 
    Body: { 
      logo_url?: string | null
      primary_color?: string | null
      secondary_color?: string | null
      text_color?: string | null
      icon_color?: string | null
    } 
  }>(
    '/stores/preferences',
    {
      onRequest: [requireAuth, tenantMiddleware]
    },
    async (
      request: FastifyRequest<{ 
        Body: { 
          logo_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          text_color?: string | null
          icon_color?: string | null
        } 
      }>,
      reply: FastifyReply
    ) => {
      try {
        const storeId = (request as any).storeId as string | undefined

        if (!storeId) {
          await reply.code(400).send({ error: 'Store ID is required' })
          return
        }

        const { logo_url, primary_color, secondary_color, text_color, icon_color } = request.body

        await updateStorePreferencesUseCase({
          storeId,
          logo_url,
          primary_color,
          secondary_color,
          text_color,
          icon_color
        })

        await reply.send({ success: true })
      } catch (error) {
        if (error instanceof Error) {
          const statusCode = error.message === 'Store not found' ? 404 : 500
          await reply.code(statusCode).send({ error: error.message })
          return
        }
        request.log.error(error)
        await reply.code(500).send({ error: 'Internal server error' })
      }
    }
  )

  // Endpoint para atualizar logo da loja
  app.put<{ Body: { logo_url: string | null } }>(
    '/stores/logo',
    {
      onRequest: [requireAuth, tenantMiddleware]
    },
    async (
      request: FastifyRequest<{ Body: { logo_url: string | null } }>,
      reply: FastifyReply
    ) => {
      try {
        const storeId = (request as any).storeId as string | undefined

        if (!storeId) {
          await reply.code(400).send({ error: 'Store ID is required' })
          return
        }

        const { logo_url } = request.body

        await updateStoreLogoUseCase({
          storeId,
          logoUrl: logo_url ?? null
        })

        await reply.send({ success: true })
      } catch (error) {
        if (error instanceof Error) {
          const statusCode = error.message === 'Store not found' ? 404 : 500
          await reply.code(statusCode).send({ error: error.message })
          return
        }
        request.log.error(error)
        await reply.code(500).send({ error: 'Internal server error' })
      }
    }
  )

  // Endpoint para atualizar banner da loja
  app.put<{ Body: { banner_url: string | null } }>(
    '/stores/banner',
    {
      onRequest: [requireAuth, tenantMiddleware]
    },
    async (
      request: FastifyRequest<{ Body: { banner_url: string | null } }>,
      reply: FastifyReply
    ) => {
      try {
        const storeId = (request as any).storeId as string | undefined

        if (!storeId) {
          await reply.code(400).send({ error: 'Store ID is required' })
          return
        }

        const { banner_url } = request.body

        await updateStoreBannerUseCase({
          storeId,
          bannerUrl: banner_url ?? null
        })

        await reply.send({ success: true })
      } catch (error) {
        if (error instanceof Error) {
          const statusCode = error.message === 'Store not found' ? 404 : 500
          await reply.code(statusCode).send({ error: error.message })
          return
        }
        request.log.error(error)
        await reply.code(500).send({ error: 'Internal server error' })
      }
    }
  )
}

