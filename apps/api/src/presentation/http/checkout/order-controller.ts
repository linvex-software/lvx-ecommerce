import type { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { createOrderUseCase, createOrderSchema } from '../../../application/orders/use-cases/create-order'
import { OrderRepository } from '../../../infra/db/repositories/order-repository'
import { ProductRepository } from '../../../infra/db/repositories/product-repository'
import { StockMovementRepository } from '../../../infra/db/repositories/stock-movement-repository'
import { CouponRepository } from '../../../infra/db/repositories/coupon-repository'
import { CartRepository } from '../../../infra/db/repositories/cart-repository'

export class CheckoutOrderController {
  async create(
    request: FastifyRequest<{ Body: z.infer<typeof createOrderSchema> }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const storeId = request.storeId
      if (!storeId) {
        await reply.code(400).send({ error: 'Store ID is required' })
        return
      }

      const validated = createOrderSchema.parse(request.body)

      const orderRepository = new OrderRepository()
      const productRepository = new ProductRepository()
      const stockMovementRepository = new StockMovementRepository()
      const couponRepository = new CouponRepository()
      const cartRepository = new CartRepository()

      const order = await createOrderUseCase(validated, storeId, {
        orderRepository,
        productRepository,
        stockMovementRepository,
        couponRepository,
        cartRepository
      })

      await reply.status(201).send({ order })
    } catch (error) {
      if (error instanceof z.ZodError) {
        await reply.status(400).send({
          error: 'Validation error',
          details: error.errors
        })
        return
      }

      if (error instanceof Error) {
        // Erros específicos de negócio
        const statusCode =
          error.message.includes('not found') ||
          error.message.includes('Insufficient stock') ||
          error.message.includes('is not active')
            ? 400
            : error.message.includes('Invalid coupon')
            ? 400
            : 500

        await reply.status(statusCode).send({ error: error.message })
        return
      }

      await reply.status(500).send({ error: 'Internal server error' })
    }
  }
}

