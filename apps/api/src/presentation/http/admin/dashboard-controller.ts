import type { FastifyRequest, FastifyReply } from 'fastify'
import { ZodError } from 'zod'
import { getTopProductsUseCase } from '../../../application/dashboard/use-cases/get-top-products'
import type { OrderRepository } from '../../../infra/db/repositories/order-repository'

export class DashboardController {
  constructor(private readonly orderRepository: OrderRepository) {}

  async getTopProducts(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const storeId = request.storeId
      if (!storeId) {
        await reply.code(400).send({ error: 'Store ID is required' })
        return
      }

      const topProducts = await getTopProductsUseCase(storeId, {
        orderRepository: this.orderRepository
      })

      await reply.code(200).send({ products: topProducts })
    } catch (error) {
      if (error instanceof ZodError) {
        await reply.code(400).send({
          error: 'Invalid request',
          details: error.errors
        })
        return
      }

      request.log.error(error)
      await reply.code(500).send({ error: 'Internal server error' })
    }
  }
}

