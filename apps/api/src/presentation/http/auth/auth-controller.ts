import type { FastifyRequest, FastifyReply } from 'fastify'
import { ZodError } from 'zod'
import { loginUseCase, type LoginDependencies } from '../../../application/auth/use-cases/login'
import {
  refreshTokenUseCase,
  type RefreshTokenDependencies
} from '../../../application/auth/use-cases/refresh-token'
import { logoutUseCase, type LogoutDependencies } from '../../../application/auth/use-cases/logout'
import { UserRepository } from '../../../infra/db/repositories/user-repository'
import { AuthSessionRepository } from '../../../infra/db/repositories/auth-session-repository'
import { loginSchema } from '@white-label/types'

interface LoginBody {
  email: string
  password: string
}

export class AuthController {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly authSessionRepository: AuthSessionRepository,
    private readonly jwtSign: (payload: {
      sub: string
      storeId?: string
      role?: string
    }) => Promise<string>
  ) {}

  async login(request: FastifyRequest<{ Body: LoginBody }>, reply: FastifyReply) {
    try {
      const validated = loginSchema.parse(request.body)

      const dependencies: LoginDependencies = {
        userRepository: this.userRepository,
        authSessionRepository: this.authSessionRepository,
        jwtSign: this.jwtSign
      }

      const result = await loginUseCase(validated, dependencies)

      // Se houver token (store única selecionada automaticamente), definir cookie
      if (result.refreshToken) {
      const isProduction = process.env.NODE_ENV === 'production'

      reply.setCookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        sameSite: 'lax',
        secure: isProduction,
        path: '/',
        maxAge: 60 * 60 * 24 * 30
      })
      }

      await reply.send({
        accessToken: result.accessToken || null,
        user: result.user
      })
    } catch (error) {
      if (error instanceof ZodError) {
        await reply.code(400).send({ 
          error: 'Validation error', 
          details: error.errors 
        })
        return
      }
      if (error instanceof Error) {
        const statusCode = error.message === 'Invalid credentials' || error.message === 'Store is not active' ? 401 : 500
        await reply.code(statusCode).send({ error: error.message })
        return
      }
      await reply.code(500).send({ error: 'Internal server error' })
    }
  }

  async refresh(request: FastifyRequest, reply: FastifyReply) {
    try {
      const refreshToken = request.cookies.refreshToken as string | undefined

      if (!refreshToken) {
        await reply.code(401).send({ error: 'Refresh token not found' })
        return
      }

      const dependencies: RefreshTokenDependencies = {
        userRepository: this.userRepository,
        authSessionRepository: this.authSessionRepository,
        jwtSign: this.jwtSign
      }

      const result = await refreshTokenUseCase(refreshToken, dependencies)

      if (result.refreshToken) {
        const isProduction = process.env.NODE_ENV === 'production'

        reply.setCookie('refreshToken', result.refreshToken, {
          httpOnly: true,
          sameSite: 'lax',
          secure: isProduction,
          path: '/',
          maxAge: 60 * 60 * 24 * 30
        })
      }

      await reply.send({
        accessToken: result.accessToken,
        user: result.user
      })
    } catch (error) {
      if (error instanceof Error) {
        await reply.code(401).send({ error: error.message })
        return
      }
      await reply.code(500).send({ error: 'Internal server error' })
    }
  }

  async logout(request: FastifyRequest, reply: FastifyReply) {
    try {
      const refreshToken = request.cookies.refreshToken as string | undefined
      const userId = (request.user as { id: string } | undefined)?.id

      if (!refreshToken || !userId) {
        await reply.code(401).send({ error: 'Not authenticated' })
        return
      }

      const dependencies: LogoutDependencies = {
        authSessionRepository: this.authSessionRepository,
        revokeAll: false
      }

      await logoutUseCase(refreshToken, userId, dependencies)

      reply.clearCookie('refreshToken', {
        path: '/'
      })

      await reply.code(204).send()
    } catch (error) {
      if (error instanceof Error) {
        await reply.code(500).send({ error: error.message })
        return
      }
      await reply.code(500).send({ error: 'Internal server error' })
    }
  }

  async me(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request.user as { id: string } | undefined)?.id

      if (!userId) {
        await reply.code(401).send({ error: 'Not authenticated' })
        return
      }

      const userWithStore = await this.userRepository.findByIdWithStore(userId)

      if (!userWithStore) {
        await reply.code(404).send({ error: 'User not found' })
        return
      }

      await reply.send({
        user: {
          id: userWithStore.id,
          email: userWithStore.email,
          name: userWithStore.name,
          role: userWithStore.role || undefined,
          storeId: userWithStore.store_id || undefined,
          store: userWithStore.store || undefined
        }
      })
    } catch (error) {
      await reply.code(500).send({ error: 'Internal server error' })
    }
  }
}

