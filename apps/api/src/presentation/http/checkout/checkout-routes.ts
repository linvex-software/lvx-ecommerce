import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { CheckoutController } from './checkout-controller'
import { CouponRepository } from '../../../infra/db/repositories/coupon-repository'
import { tenantMiddleware } from '../../../infra/http/middlewares/tenant'

export async function registerCheckoutRoutes(app: FastifyInstance): Promise<void> {
  const couponRepository = new CouponRepository()
  const checkoutController = new CheckoutController(couponRepository)

  // POST /checkout/validate-coupon - Valida cupom (público, apenas tenantMiddleware)
  app.post(
    '/checkout/validate-coupon',
    {
      onRequest: [tenantMiddleware]
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      await checkoutController.validateCoupon(request, reply)
    }
  )
}

