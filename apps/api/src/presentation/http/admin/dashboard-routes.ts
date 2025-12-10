import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { DashboardController } from './dashboard-controller'
import { OrderRepository } from '../../../infra/db/repositories/order-repository'
import { ProductRepository } from '../../../infra/db/repositories/product-repository'
import { tenantMiddleware } from '../../../infra/http/middlewares/tenant'
import { requireAuth, requireRole } from '../../../infra/http/middlewares/auth'

export async function registerAdminDashboardRoutes(
  app: FastifyInstance
): Promise<void> {
  const orderRepository = new OrderRepository()
  const productRepository = new ProductRepository()
  const dashboardController = new DashboardController(orderRepository, productRepository)

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

  // GET /admin/dashboard/sales - Vendas por período (agregadas por dia)
  app.get<{
    Querystring: {
      start_date?: string
      end_date?: string
    }
  }>(
    '/admin/dashboard/sales',
    {
      onRequest: [requireAuth, tenantMiddleware],
      preHandler: [requireRole(['admin', 'operador'])]
    },
    async (request: FastifyRequest<{
      Querystring: {
        start_date?: string
        end_date?: string
      }
    }>, reply: FastifyReply) => {
      await dashboardController.getSalesByPeriod(request, reply)
    }
  )

  // GET /admin/dashboard/revenue - Métricas de receita do período
  app.get<{
    Querystring: {
      start_date?: string
      end_date?: string
    }
  }>(
    '/admin/dashboard/revenue',
    {
      onRequest: [requireAuth, tenantMiddleware],
      preHandler: [requireRole(['admin', 'operador'])]
    },
    async (request: FastifyRequest<{
      Querystring: {
        start_date?: string
        end_date?: string
      }
    }>, reply: FastifyReply) => {
      await dashboardController.getRevenueMetrics(request, reply)
    }
  )

  // GET /admin/dashboard/metrics - Métricas operacionais
  app.get(
    '/admin/dashboard/metrics',
    {
      onRequest: [requireAuth, tenantMiddleware],
      preHandler: [requireRole(['admin', 'operador'])]
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      await dashboardController.getOperationalMetrics(request, reply)
    }
  )

  // GET /admin/dashboard/critical-stock - Produtos com estoque crítico
  app.get<{
    Querystring: {
      min_stock?: string
    }
  }>(
    '/admin/dashboard/critical-stock',
    {
      onRequest: [requireAuth, tenantMiddleware],
      preHandler: [requireRole(['admin', 'operador'])]
    },
    async (request: FastifyRequest<{
      Querystring: {
        min_stock?: string
      }
    }>, reply: FastifyReply) => {
      await dashboardController.getCriticalStock(request, reply)
    }
  )
}

