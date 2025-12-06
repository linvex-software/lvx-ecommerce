import type { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { validateCouponForCheckoutUseCase } from '../../../application/coupons/use-cases/validate-coupon-for-checkout'
import { CouponRepository } from '../../../infra/db/repositories/coupon-repository'

const validateCouponSchema = z.object({
  code: z.string().min(1),
  orderTotal: z.number().int().positive()
})

export class CheckoutController {
  constructor(private readonly couponRepository: CouponRepository) {}

  async validateCoupon(request: FastifyRequest, reply: FastifyReply) {
    try {
      const storeId = request.storeId
      if (!storeId) {
        await reply.code(400).send({ error: 'Store ID is required' })
        return
      }

      const validated = validateCouponSchema.parse(request.body)

      const result = await validateCouponForCheckoutUseCase(
        {
          storeId,
          code: validated.code,
          orderTotal: validated.orderTotal
        },
        {
          couponRepository: this.couponRepository
        }
      )

      await reply.send(result)
    } catch (error) {
      if (error instanceof z.ZodError) {
        await reply.code(400).send({
          error: 'Validation error',
          details: error.errors
        })
        return
      }
      if (error instanceof Error) {
        await reply.code(500).send({ error: error.message })
        return
      }
      await reply.code(500).send({ error: 'Internal server error' })
    }
  }
}

