import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { CouponController } from './coupon-controller'
import { CouponRepository } from '../../../infra/db/repositories/coupon-repository'
import { tenantMiddleware } from '../../../infra/http/middlewares/tenant'
import { requireAuth } from '../../../infra/http/middlewares/auth'
import { requireRole } from '../../../infra/http/middlewares/auth'

export async function registerAdminCouponRoutes(app: FastifyInstance): Promise<void> {
  const couponRepository = new CouponRepository()
  const couponController = new CouponController(couponRepository)

  // GET /admin/coupons - Lista cupons (admin ou operador)
  app.get<{ Querystring: { active?: string } }>(
    '/admin/coupons',
    {
      onRequest: [requireAuth, tenantMiddleware],
      preHandler: [requireRole(['admin', 'operador'])]
    },
    async (request: FastifyRequest<{ Querystring: { active?: string } }>, reply: FastifyReply) => {
      await couponController.list(request, reply)
    }
  )

  // POST /admin/coupons - Cria cupom (apenas admin)
  app.post(
    '/admin/coupons',
    {
      onRequest: [requireAuth, tenantMiddleware],
      preHandler: [requireRole(['admin'])]
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      await couponController.create(request, reply)
    }
  )

  // PUT /admin/coupons/:id - Atualiza cupom (apenas admin)
  app.put<{ Params: { id: string } }>(
    '/admin/coupons/:id',
    {
      onRequest: [requireAuth, tenantMiddleware],
      preHandler: [requireRole(['admin'])]
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      await couponController.update(request, reply)
    }
  )

  // DELETE /admin/coupons/:id - Deleta cupom (apenas admin)
  app.delete<{ Params: { id: string } }>(
    '/admin/coupons/:id',
    {
      onRequest: [requireAuth, tenantMiddleware],
      preHandler: [requireRole(['admin'])]
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      await couponController.delete(request, reply)
    }
  )
}

