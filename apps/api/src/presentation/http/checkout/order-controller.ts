import type { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { createOrderUseCase, createOrderSchema } from '../../../application/orders/use-cases/create-order'
import { OrderRepository } from '../../../infra/db/repositories/order-repository'
import { ProductRepository } from '../../../infra/db/repositories/product-repository'
import { StockMovementRepository } from '../../../infra/db/repositories/stock-movement-repository'
import { CouponRepository } from '../../../infra/db/repositories/coupon-repository'
import { CartRepository } from '../../../infra/db/repositories/cart-repository'
import { PickupPointRepository } from '../../../infra/db/repositories/pickup-point-repository'
import { MelhorEnvioGateway } from '../../../infra/gateways/melhor-envio-gateway'

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

      // Extrair customer_id do JWT se cliente estiver autenticado
      const customer = request.customer
      const customerId = customer?.id ?? validated.customer_id ?? null

      const orderRepository = new OrderRepository()
      const productRepository = new ProductRepository()
      const stockMovementRepository = new StockMovementRepository()
      const couponRepository = new CouponRepository()
      const cartRepository = new CartRepository()
      const pickupPointRepository = new PickupPointRepository()

      // Obter token do Melhor Envio
      const melhorEnvioToken =
        process.env.MELHOR_ENVIO_API_TOKEN ||
        'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiI5NTYiLCJqdGkiOiI0ZmYyY2U2MzA3ZmI0YTg0MDkzMTRkYjkwYWI4Y2NiMmVkNzZjNWQ3OTRmMjQyNjg3NGUyZjE2MjI1YTZlZDMxOGYyMDlhZmJhNjQ0YWI3YSIsImlhdCI6MTc2NDM1NzU0MS40MjUwNjksIm5iZiI6MTc2NDM1NzU0MS40MjUwNzIsImV4cCI6MTc5NTg5MzU0MS40MTgxOTgsInN1YiI6ImEwNzdhNWJiLTRmMGYtNGU5YS04ZmNjLThkNzgyYTQzMWRlOSIsInNjb3BlcyI6WyJjYXJ0LXJlYWQiLCJjYXJ0LXdyaXRlIiwiY29tcGFuaWVzLXJlYWQiLCJjb21wYW5pZXMtd3JpdGUiLCJjb3Vwb25zLXJlYWQiLCJjb3Vwb25zLXdyaXRlIiwibm90aWZpY2F0aW9ucy1yZWFkIiwib3JkZXJzLXJlYWQiLCJwcm9kdWN0cy1yZWFkIiwicHJvZHVjdHMtZGVzdHJveSIsInByb2R1Y3RzLXdyaXRlIiwicHVyY2hhc2VzLXJlYWQiLCJzaGlwcGluZy1jYWxjdWxhdGUiLCJzaGlwcGluZy1jYW5jZWwiLCJzaGlwcGluZy1jaGVja291dCIsInNoaXBwaW5nLWNvbXBhbmllcyIsInNoaXBwaW5nLWdlbmVyYXRlIiwic2hpcHBpbmctcHJldmlldyIsInNoaXBwaW5nLXByaW50Iiwic2hpcHBpbmctc2hhcmUiLCJzaGlwcGluZy10cmFja2luZyIsImVjb21tZXJjZS1zaGlwcGluZyIsInRyYW5zYWN0aW9ucy1yZWFkIiwidXNlcnMtcmVhZCIsInVzZXJzLXdyaXRlIiwid2ViaG9va3MtcmVhZCIsIndlYmhvb2tzLXdyaXRlIiwid2ViaG9va3MtZGVsZXRlIiwidGRlYWxlci13ZWJob29rIl19.NcPQcu_x3V3NuTbBsqJvQi1BXtod0HRYASIX7KsigkEK93SEU5Uddtk63_t0XDXLrcnup1VIGC1qdw8MHZwkeOANs41w7uv_fPfvF525Cd2t0wBzv-P6xXdTKzS3kdYfmQ6gO4DNutaUDX6BhwcU2jesxcUAPkLB9RQ0iv90-1WAzNhvC7W_0z63dmBDPTh8nbGMeF6OFjn5VzEL6_zk-lwmrfZH0zrgOfImVuu1koJuyLb5dscv-Nxjo6F9wkCezEcIBN0IXZqFyCjfz6myPp8TTQ4YaBBndlMWtNi1Bh9Gpg3LLUwnIiK2S6k_mlU-qRqRFBZEi-OTtN_SkX31VDzlp1cuFcUpHZUCx2eq-vOCKHrPr68OsCG2E6lTNoaxyN7JdIhRogWcYDGN_oOyh307RvBaWoYBritUeuPo4QVp4da0w5JoJ6k7b8MUM0jsbb9bN6-q5WZxTYWsYgU_tJbynULO0ImqNqEhqqJ0B9wfcvVNJmHP2oSs0WfWu9JfDQyGV6rUZRFvLyzABi2CT0VSxtlylmcmuDc3uEFbbjlnfZh-iiYiWRPzMCdgJQ-sXHeS57OZNNE8oxundVUc-qnFIW0j1hoXxFlPlWpbWJYSnexLvPiGKLfpokM5hlz3WUmzNaakU9S39iVpcfLdpU1HtxN1-uz-2f8I1qFTZUs'
      const shippingGateway = new MelhorEnvioGateway(melhorEnvioToken)

      const order = await createOrderUseCase(
        {
          ...validated,
          customer_id: customerId
        },
        storeId,
        {
        orderRepository,
        productRepository,
        stockMovementRepository,
        couponRepository,
        cartRepository,
        pickupPointRepository,
        shippingGateway
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

