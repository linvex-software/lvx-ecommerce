import type { FastifyInstance, FastifyRequest } from 'fastify'
import { OrderController } from './order-controller'
import { OrderRepository } from '../../../infra/db/repositories/order-repository'
import { tenantMiddleware } from '../../../infra/http/middlewares/tenant'
import { requireAuth } from '../../../infra/http/middlewares/auth'
import { requireRole } from '../../../infra/http/middlewares/auth'

export async function registerAdminOrderRoutes(app: FastifyInstance): Promise<void> {
  const orderRepository = new OrderRepository()
  const orderController = new OrderController(orderRepository)

  // GET /admin/orders - Lista pedidos (admin ou operador)
  app.get<{
    Querystring: {
      status?: string
      payment_status?: string
      customer_id?: string
      start_date?: string
      end_date?: string
    }
  }>(
    '/admin/orders',
    {
      onRequest: [requireAuth, tenantMiddleware],
      preHandler: [requireRole(['admin', 'operador'])]
    },
    async (request, reply) => {
      await orderController.list(request, reply)
    }
  )

  // GET /admin/orders/:id - Detalhes do pedido (admin ou operador)
  app.get<{ Params: { id: string } }>(
    '/admin/orders/:id',
    {
      onRequest: [requireAuth, tenantMiddleware],
      preHandler: [requireRole(['admin', 'operador'])]
    },
    async (request, reply) => {
      await orderController.get(request, reply)
    }
  )

  // PUT /admin/orders/:id - Atualiza pedido (apenas admin)
  app.put<{ Params: { id: string } }>(
    '/admin/orders/:id',
    {
      onRequest: [requireAuth, tenantMiddleware],
      preHandler: [requireRole(['admin'])]
    },
    async (request, reply) => {
      await orderController.update(request as FastifyRequest<{ Params: { id: string }; Body: import('../../../domain/orders/order-types').UpdateOrderInput }>, reply)
    }
  )

  // GET /admin/orders/:id/shipping-label - Download da etiqueta de frete (admin ou operador)
  app.get<{ Params: { id: string } }>(
    '/admin/orders/:id/shipping-label',
    {
      onRequest: [requireAuth, tenantMiddleware],
      preHandler: [requireRole(['admin', 'operador'])]
    },
    async (request, reply) => {
      await orderController.downloadShippingLabel(request, reply)
    }
  )

  // POST /admin/orders/:id/cancel - Cancela pedido com estorno de estoque (apenas admin)
  app.post<{ Params: { id: string } }>(
    '/admin/orders/:id/cancel',
    {
      onRequest: [requireAuth, tenantMiddleware],
      preHandler: [requireRole(['admin'])]
    },
    async (request, reply) => {
      await orderController.cancel(request as FastifyRequest<{ Params: { id: string }; Body: { reason?: string | null } }>, reply)
    }
  )
}

