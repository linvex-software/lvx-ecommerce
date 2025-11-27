import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { AuthController } from './auth-controller'
import { UserRepository } from '../../../infra/db/repositories/user-repository'
import { AuthSessionRepository } from '../../../infra/db/repositories/auth-session-repository'
import { tenantMiddleware } from '../../../infra/http/middlewares/tenant'
import { requireAuth } from '../../../infra/http/middlewares/auth'

interface LoginBody {
  email: string
  password: string
}

export async function registerAuthRoutes(
  app: FastifyInstance
): Promise<void> {
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

  const authController = new AuthController(
    userRepository,
    authSessionRepository,
    jwtSign
  )

  // Rotas de autenticação
  // Login não usa tenantMiddleware nem requireAuth (público)
  app.post<{ Body: LoginBody }>(
    '/auth/login',
    async (request: FastifyRequest<{ Body: LoginBody }>, reply: FastifyReply) => {
      await authController.login(request, reply)
    }
  )

  app.post(
    '/auth/refresh',
    // Refresh não precisa de tenantMiddleware (funciona sem store)
    async (request: FastifyRequest, reply: FastifyReply) => {
      await authController.refresh(request, reply)
    }
  )

  // Rota para buscar informações do usuário autenticado
  app.get(
    '/auth/me',
    {
      onRequest: [requireAuth]
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      await authController.me(request, reply)
    }
  )

  // Logout requer autenticação (requireAuth primeiro para preencher user.storeId)
  app.post(
    '/auth/logout',
    {
      onRequest: [requireAuth, tenantMiddleware]
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      await authController.logout(request, reply)
    }
  )
}

