import type { UserRole } from '../../../domain/auth/auth-types'

declare module 'fastify' {
  interface FastifyRequest {
    storeId?: string
  }
  
  // Estende o user do JWT com nosso tipo customizado
  namespace FastifyJWT {
    interface User {
      id: string
      email: string
      name: string
      role: UserRole
      storeId: string
    }
  }
}

