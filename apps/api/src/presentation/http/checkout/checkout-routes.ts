import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { CheckoutController } from './checkout-controller'
import { CheckoutOrderController } from './order-controller'
import { DeliveryOptionsController } from './delivery-options-controller'
import { CouponRepository } from '../../../infra/db/repositories/coupon-repository'
import { tenantMiddleware } from '../../../infra/http/middlewares/tenant'
import { createOrderSchema } from '../../../application/orders/use-cases/create-order'
import { getDeliveryOptionsSchema } from '../../../application/checkout/use-cases/get-delivery-options'

export async function registerCheckoutRoutes(app: FastifyInstance): Promise<void> {
  const couponRepository = new CouponRepository()
  const checkoutController = new CheckoutController(couponRepository)
  const checkoutOrderController = new CheckoutOrderController()
  const deliveryOptionsController = new DeliveryOptionsController()

  // POST /checkout/delivery-options - Busca opções de entrega (frete + pickup) (público, apenas tenantMiddleware)
  app.post<{ Body: z.infer<typeof getDeliveryOptionsSchema> }>(
    '/checkout/delivery-options',
    {
      onRequest: [tenantMiddleware]
    },
    async (request: FastifyRequest<{ Body: z.infer<typeof getDeliveryOptionsSchema> }>, reply: FastifyReply) => {
      await deliveryOptionsController.get(request, reply)
    }
  )

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

  // POST /orders - Cria pedido (checkout público, apenas tenantMiddleware)
  app.post<{ Body: z.infer<typeof createOrderSchema> }>(
    '/orders',
    {
      onRequest: [tenantMiddleware]
    },
    async (request: FastifyRequest<{ Body: z.infer<typeof createOrderSchema> }>, reply: FastifyReply) => {
      await checkoutOrderController.create(request, reply)
    }
  )
}

