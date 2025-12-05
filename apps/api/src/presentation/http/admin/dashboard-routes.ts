import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { DashboardController } from './dashboard-controller'
import { OrderRepository } from '../../../infra/db/repositories/order-repository'
import { tenantMiddleware } from '../../../infra/http/middlewares/tenant'
import { requireAuth, requireRole } from '../../../infra/http/middlewares/auth'

export async function registerAdminDashboardRoutes(
  app: FastifyInstance
): Promise<void> {
  const orderRepository = new OrderRepository()
  const dashboardController = new DashboardController(orderRepository)

  // GET /admin/dashboard/top-products - Top 10 produtos dos últimos 30 dias
  app.get(
    '/admin/dashboard/top-products',
    {
      onRequest: [requireAuth, tenantMiddleware],
      preHandler: [requireRole(['admin', 'operador'])]
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      await dashboardController.getTopProducts(request, reply)
    }
  )
}

