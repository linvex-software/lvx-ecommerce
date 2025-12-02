import type { FastifyInstance } from 'fastify'
import { CustomerController } from './customer-controller'
import { CustomerRepository } from '../../../infra/db/repositories/customer-repository'
import { AuthSessionRepository } from '../../../infra/db/repositories/auth-session-repository'
import { tenantMiddleware } from '../../../infra/http/middlewares/tenant'
import { requireCustomerAuth } from '../../../infra/http/middlewares/customer-auth'

export async function registerCustomerRoutes(
  app: FastifyInstance
): Promise<void> {
  const customerRepository = new CustomerRepository()
  const authSessionRepository = new AuthSessionRepository()

  const jwtSign = async (payload: {
    sub: string
    storeId: string
    type: 'customer'
  }): Promise<string> => {
    if (!app.jwt) {
      throw new Error(
        'JWT is not configured. Please set JWT_ACCESS_SECRET in .env file'
      )
    }
    try {
      return app.jwt.sign(payload)
    } catch (error) {
      throw new Error(
        `JWT sign error: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  const customerController = new CustomerController(
    customerRepository,
    authSessionRepository,
    jwtSign
  )

  // POST /customers/register - Cadastro público (exige store_id via tenant)
  app.post(
    '/customers/register',
    {
      onRequest: [tenantMiddleware]
    },
    async (request, reply) => {
      await customerController.register(request, reply)
    }
  )

  // POST /customers/login - Login público (exige store_id)
  app.post(
    '/customers/login',
    {
      onRequest: [tenantMiddleware]
    },
    async (request, reply) => {
      await customerController.login(request, reply)
    }
  )

  // GET /customers/me - Perfil do cliente (protegido)
  app.get(
    '/customers/me',
    {
      onRequest: [tenantMiddleware, requireCustomerAuth]
    },
    async (request, reply) => {
      await customerController.me(request, reply)
    }
  )

  // PUT /customers/me - Atualizar perfil (protegido)
  app.put(
    '/customers/me',
    {
      onRequest: [tenantMiddleware, requireCustomerAuth]
    },
    async (request, reply) => {
      await customerController.updateProfile(request, reply)
    }
  )
}

