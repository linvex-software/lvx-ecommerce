import type { FastifyInstance } from 'fastify'
import { CustomerController } from './customer-controller'
import { CustomerRepository } from '../../../infra/db/repositories/customer-repository'
import { tenantMiddleware } from '../../../infra/http/middlewares/tenant'
import { requireAuth } from '../../../infra/http/middlewares/auth'
import { requireRole } from '../../../infra/http/middlewares/auth'

export async function registerAdminCustomerRoutes(app: FastifyInstance): Promise<void> {
  const customerRepository = new CustomerRepository()
  const customerController = new CustomerController(customerRepository)

  // GET /admin/customers - Lista clientes (admin ou operador)
  app.get(
    '/admin/customers',
    {
      onRequest: [requireAuth, tenantMiddleware],
      preHandler: [requireRole(['admin', 'operador'])]
    },
    async (request, reply) => {
      await customerController.list(request, reply)
    }
  )
}

