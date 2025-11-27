import 'dotenv/config'

import Fastify, { type FastifyRequest } from 'fastify'
import cors from '@fastify/cors'
import multipart from '@fastify/multipart'
import swagger from '@fastify/swagger'
import jwt from '@fastify/jwt'
import cookie from '@fastify/cookie'
import { registerAuthRoutes } from './presentation/http/auth/auth-routes'
import { registerAdminCouponRoutes } from './presentation/http/admin/coupon-routes'
import { registerAdminProductRoutes } from './presentation/http/admin/product-routes'
import { registerAdminCategoryRoutes } from './presentation/http/admin/category-routes'
import { registerAdminOrderRoutes } from './presentation/http/admin/order-routes'
import { registerCatalogRoutes } from './presentation/http/catalog/product-routes'
import { registerCatalogCategoryRoutes } from './presentation/http/catalog/category-routes'
import { registerCheckoutRoutes } from './presentation/http/checkout/checkout-routes'
import { registerWebhookRoutes } from './presentation/http/webhooks/webhook-routes'
import { registerStoreRoutes } from './presentation/http/store-routes'
import { registerPhysicalSalesRoutes } from './presentation/http/physical-sales/physical-sales-routes'

async function buildServer() {
  const app = Fastify({
    logger: true,
    querystringParser: (str) => {
      // Parse query string supporting arrays (e.g., sizes=G&sizes=GG)
      const params = new URLSearchParams(str)
      const result: Record<string, string | string[]> = {}
      
      for (const [key, value] of params.entries()) {
        // Check if this key appears multiple times in the query string
        const allValues = params.getAll(key)
        
        if (allValues.length > 1) {
          // Multiple values = array
          result[key] = allValues
        } else {
          // Single value = string
          result[key] = value
        }
      }
      
      return result
    }
  })

  // Parser customizado para application/json
  // Retorna JSON parseado normalmente, mas também armazena raw body como Buffer
  // Isso permite validação HMAC em webhooks sem quebrar outras rotas
  app.addContentTypeParser(
    'application/json',
    { parseAs: 'buffer' },
    async (req: FastifyRequest & { rawBody?: Buffer }, body: Buffer) => {
      try {
        // Sempre armazenar raw body (será usado apenas em webhooks)
        req.rawBody = body

        // Se body estiver vazio, retornar objeto vazio
        if (body.length === 0) {
          return {}
        }

        // Parsear e retornar JSON (para não quebrar outras rotas)
        const json = JSON.parse(body.toString('utf-8')) as Record<string, unknown>
        return json
      } catch (error) {
        // Se falhar ao fazer parse, retornar objeto vazio (pode ser body vazio)
        if (body.length === 0) {
          return {}
        }
        throw error as Error
      }
    }
  )

  await app.register(cors, {
    origin: true,
    credentials: true
  })
  await app.register(cookie, {
    secret: process.env.COOKIE_SECRET || 'cookie-secret-change-me'
  })
  await app.register(multipart)
  await app.register(swagger, {
    openapi: {
      info: {
        title: 'White Label API',
        version: '0.1.0',
        description: 'API REST para o sistema de e-commerce white label'
      },
      servers: [
        {
          url: `http://localhost:${process.env.PORT || 3333}`,
          description: 'Servidor de desenvolvimento'
        }
      ]
    }
  })

  const jwtAccessSecret = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET
  if (!jwtAccessSecret) {
    app.log.warn('JWT_ACCESS_SECRET não encontrado. JWT desabilitado.')
  } else {
    await app.register(jwt, {
      secret: jwtAccessSecret
    })
  }

  app.get('/', async () => {
    return {
      name: 'White Label API',
      version: '0.1.0',
      status: 'running',
      endpoints: {
        health: '/health',
        swagger: '/documentation/json'
      }
    }
  })

  app.get('/health', async () => {
    return { ok: true, timestamp: new Date().toISOString() }
  })

  await registerAuthRoutes(app)
  await registerAdminCouponRoutes(app)
  await registerAdminProductRoutes(app)
  await registerAdminCategoryRoutes(app)
  await registerAdminOrderRoutes(app)
  await registerCatalogRoutes(app)
  await registerCatalogCategoryRoutes(app)
  await registerCheckoutRoutes(app)
  await registerWebhookRoutes(app)
  await registerStoreRoutes(app)
  await registerPhysicalSalesRoutes(app)

  return app
}

async function start() {
  try {
    const app = await buildServer()
    const port = Number(process.env.PORT || 3333)
    const host = '0.0.0.0'

    await app.listen({ port, host })
    app.log.info(`🚀 API rodando em http://${host === '0.0.0.0' ? 'localhost' : host}:${port}`)
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error)
    process.exit(1)
  }
}

start()

