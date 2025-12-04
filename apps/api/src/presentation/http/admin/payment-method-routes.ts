import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { PaymentMethodController } from './payment-method-controller'
import { tenantMiddleware } from '../../../infra/http/middlewares/tenant'
import { requireAuth, requireRole } from '../../../infra/http/middlewares/auth'

export async function registerAdminPaymentMethodRoutes(
  app: FastifyInstance
): Promise<void> {
  const controller = new PaymentMethodController()

  // GET /admin/payment-methods - Lista métodos de pagamento
  app.get(
    '/admin/payment-methods',
    {
      onRequest: [requireAuth, tenantMiddleware],
      preHandler: [requireRole(['admin', 'operador'])]
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      await controller.list(request, reply)
    }
  )

  // GET /admin/payment-methods/:id - Busca método de pagamento por ID
  app.get<{ Params: { id: string } }>(
    '/admin/payment-methods/:id',
    {
      onRequest: [requireAuth, tenantMiddleware],
      preHandler: [requireRole(['admin', 'operador'])]
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      await controller.getById(request, reply)
    }
  )

  // POST /admin/payment-methods - Cria método de pagamento
  app.post(
    '/admin/payment-methods',
    {
      onRequest: [requireAuth, tenantMiddleware],
      preHandler: [requireRole(['admin', 'operador'])]
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      await controller.create(request, reply)
    }
  )

  // PUT /admin/payment-methods/:id - Atualiza método de pagamento
  app.put<{ Params: { id: string } }>(
    '/admin/payment-methods/:id',
    {
      onRequest: [requireAuth, tenantMiddleware],
      preHandler: [requireRole(['admin', 'operador'])]
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      await controller.update(request, reply)
    }
  )
}

