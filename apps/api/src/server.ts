// Carregar .env da raiz do projeto (não da pasta apps/api)
import { config } from 'dotenv'
import { resolve } from 'path'
import { existsSync } from 'fs'

// Tentar encontrar o .env na raiz do projeto (subindo 2 níveis de apps/api)
const envPath = resolve(process.cwd(), '../../.env')
if (existsSync(envPath)) {
  config({ path: envPath })
} else {
  // Fallback: tentar na raiz atual
  const currentEnvPath = resolve(process.cwd(), '.env')
  if (existsSync(currentEnvPath)) {
    config({ path: currentEnvPath })
  } else {
    // Último fallback: usar dotenv/config padrão
    config()
  }
}

// Debug: log todas as variáveis de ambiente disponíveis no Railway (apenas nomes, não valores)
if (process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_PROJECT_NAME) {
  console.log('[Railway] Ambiente detectado')
  console.log('[Railway] Variáveis de ambiente disponíveis:', Object.keys(process.env).sort().join(', '))
  console.log('[Railway] NODE_ENV:', process.env.NODE_ENV)
}

import Fastify, { type FastifyRequest } from 'fastify'
import cors from '@fastify/cors'
import multipart from '@fastify/multipart'
import swagger from '@fastify/swagger'
import jwt from '@fastify/jwt'
import cookie from '@fastify/cookie'
import { gunzipSync } from 'zlib'
import { registerAuthRoutes } from './presentation/http/auth/auth-routes'
import { registerAdminCouponRoutes } from './presentation/http/admin/coupon-routes'
import { registerAdminProductRoutes } from './presentation/http/admin/product-routes'
import { registerAdminCategoryRoutes } from './presentation/http/admin/category-routes'
import { registerAdminOrderRoutes } from './presentation/http/admin/order-routes'
import { registerAdminDashboardRoutes } from './presentation/http/admin/dashboard-routes'
import { registerAdminCustomerRoutes } from './presentation/http/admin/customer-routes'
import { registerCatalogRoutes } from './presentation/http/catalog/product-routes'
import { registerCatalogCategoryRoutes } from './presentation/http/catalog/category-routes'
import { registerCheckoutRoutes } from './presentation/http/checkout/checkout-routes'
import { registerCartRoutes } from './presentation/http/carts/cart-routes'
import { registerWebhookRoutes } from './presentation/http/webhooks/webhook-routes'
import { registerStoreRoutes } from './presentation/http/store-routes'
import { registerPhysicalSalesRoutes } from './presentation/http/physical-sales/physical-sales-routes'
import { registerPDVRoutes } from './presentation/http/pdv/pdv-routes'
import { registerAdminUserRoutes } from './presentation/http/admin/user-routes'
import { registerShippingRoutes } from './presentation/http/shipping/shipping-routes'
import { registerCustomerRoutes } from './presentation/http/customers/customer-routes'
import { registerEditorRoutes } from './presentation/http/editor/editor-routes'
import { registerTemplateSettingsRoutes } from './presentation/http/settings/template-routes'
import { registerPaymentRoutes } from './presentation/http/payments/payment-routes'
import { registerAdminPaymentMethodRoutes } from './presentation/http/admin/payment-method-routes'
import { registerAdminReviewRoutes } from './presentation/http/admin/review-routes'
import { registerUploadRoutes } from './presentation/http/admin/upload-routes'
import { registerAdminNavbarRoutes } from './presentation/http/admin/navbar-routes'
import { registerStoreNavbarRoutes } from './presentation/http/store/navbar-routes'
import { registerAdminLandingRoutes } from './presentation/http/admin/landing-routes'
import { registerStoreLandingRoutes } from './presentation/http/store/landing-routes'

async function buildServer() {
  const app = Fastify({
    logger: true,
    bodyLimit: 10 * 1024 * 1024, // 10MB - aumenta limite para permitir layouts grandes
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
  // Também suporta descompressão gzip automática quando Content-Encoding: gzip
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

        // Verificar se o body está comprimido
        // Detecta por Content-Encoding header ou pelos bytes mágicos do gzip (1f 8b)
        const contentEncoding = req.headers['content-encoding']
        const contentType = req.headers['content-type']
        const isGzipHeader = contentEncoding === 'gzip' || contentType === 'application/gzip'
        const isGzipMagic = body.length >= 2 && body[0] === 0x1f && body[1] === 0x8b
        
        let bodyToParse = body

        if (isGzipHeader || isGzipMagic) {
          try {
            // Descomprimir o body gzip
            bodyToParse = gunzipSync(body)
          } catch (decompressError) {
            // Se falhar ao descomprimir, tentar parsear como JSON normal
            // (pode ser que o header esteja errado ou seja um payload não comprimido)
            app.log.warn({
              error: decompressError instanceof Error ? decompressError.message : 'Unknown error',
              contentEncoding,
              contentType,
              bodyLength: body.length
            }, 'Falha ao descomprimir body gzip, tentando como JSON normal')
          }
        }

        // Parsear e retornar JSON (para não quebrar outras rotas)
        const json = JSON.parse(bodyToParse.toString('utf-8')) as Record<string, unknown>
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

  // Parser para application/gzip (quando Content-Type é explicitamente gzip)
  app.addContentTypeParser(
    'application/gzip',
    { parseAs: 'buffer' },
    async (req: FastifyRequest & { rawBody?: Buffer }, body: Buffer) => {
      try {
        req.rawBody = body

        if (body.length === 0) {
          return {}
        }

        // Descomprimir o body gzip
        const decompressed = gunzipSync(body)
        const json = JSON.parse(decompressed.toString('utf-8')) as Record<string, unknown>
        return json
      } catch (error) {
        if (body.length === 0) {
          return {}
        }
        throw error as Error
      }
    }
  )

  // CORS: Permitir apenas origens específicas em produção
  const allowedOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim())
    : process.env.NODE_ENV === 'production'
    ? []
    : true // Em desenvolvimento, permitir todas (não recomendado para produção)

  await app.register(cors, {
    origin: allowedOrigins,
    credentials: true
  })
  const cookieSecret = process.env.COOKIE_SECRET

  // Debug log para Railway - sempre mostrar em Railway
  console.log('[Config] COOKIE_SECRET está definido:', !!cookieSecret)
  console.log('[Config] COOKIE_SECRET tem valor:', cookieSecret ? 'sim (length: ' + cookieSecret.length + ')' : 'não')
  
  const availableEnvVars = Object.keys(process.env)
    .filter(k => k.includes('COOKIE') || k.includes('SECRET') || k.includes('DATABASE'))
    .join(', ')
  console.log('[Config] Variáveis relacionadas disponíveis:', availableEnvVars || 'none')

  if (!cookieSecret || cookieSecret.trim() === '') {
    throw new Error(
      'COOKIE_SECRET environment variable is required.\n' +
      `Current working directory: ${process.cwd()}\n` +
      `Available cookie/secret/database env vars: ${availableEnvVars || 'none'}\n` +
      `Total env vars count: ${Object.keys(process.env).length}\n` +
      'Please set COOKIE_SECRET in Railway environment variables.\n' +
      'Generate a secure random string (e.g., openssl rand -hex 32)'
    )
  }
  await app.register(cookie, {
    secret: cookieSecret
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
  await registerAdminDashboardRoutes(app)
  await registerCatalogRoutes(app)
  await registerCatalogCategoryRoutes(app)
  await registerCheckoutRoutes(app)
  await registerCartRoutes(app)
  await registerWebhookRoutes(app)
  await registerStoreRoutes(app)
  await registerPhysicalSalesRoutes(app)
  await registerPDVRoutes(app)
  await registerAdminUserRoutes(app)
  await registerAdminCustomerRoutes(app)
  await registerShippingRoutes(app)
  await registerCustomerRoutes(app)
  await registerEditorRoutes(app)
  await registerTemplateSettingsRoutes(app)
  await registerPaymentRoutes(app)
  await registerAdminPaymentMethodRoutes(app)
  await registerAdminReviewRoutes(app)
  await registerUploadRoutes(app)
  await registerAdminNavbarRoutes(app)
  await registerStoreNavbarRoutes(app)
  await registerAdminLandingRoutes(app)
  await registerStoreLandingRoutes(app)

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

