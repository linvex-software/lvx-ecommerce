import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { db, schema } from '@white-label/db'
import { eq } from 'drizzle-orm'
import { requireAuth } from '../../infra/http/middlewares/auth'
import { createStoreUseCase } from '../../application/stores/use-cases/create-store'
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
}

