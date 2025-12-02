import type { UserRole } from '../../../domain/auth/auth-types'

export interface WebhookRequestContext {
  provider: string
  storeId: string
  signatureValid: boolean
}

declare module 'fastify' {
  interface FastifyRequest {
    storeId?: string
    webhookContext?: WebhookRequestContext
    bodyAsJson?: Record<string, unknown>
    rawBody?: Buffer // Raw body para validação HMAC em webhooks
    customer?: {
      id: string
      storeId: string
    }
  }

  // Estende o user do JWT com nosso tipo customizado
  namespace FastifyJWT {
    interface User {
      id: string
      email: string
      name: string
      role?: UserRole
      storeId?: string
    }
  }
}

