import type { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import {
  getDeliveryOptionsUseCase,
  getDeliveryOptionsSchema
} from '../../../application/checkout/use-cases/get-delivery-options'
import { MelhorEnvioGateway } from '../../../infra/gateways/melhor-envio-gateway'
import { PickupPointRepository } from '../../../infra/db/repositories/pickup-point-repository'
import { MelhorEnvioTokenRepository } from '../../../infra/db/repositories/melhor-envio-token-repository'

export class DeliveryOptionsController {
  async get(
    request: FastifyRequest<{ Body: z.infer<typeof getDeliveryOptionsSchema> }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const storeId = request.storeId
      if (!storeId) {
        await reply.code(400).send({ error: 'Store ID is required' })
        return
      }

      // Validar body
      const validated = getDeliveryOptionsSchema.parse(request.body)

      // Buscar tokens do Melhor Envio no banco (ou usar fallback do env)
      const tokenRepository = new MelhorEnvioTokenRepository()
      const tokens = await tokenRepository.findByStoreId(storeId)

      // Callback para salvar tokens atualizados após refresh
      const onTokenRefresh = async (newToken: string, newRefreshToken: string) => {
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + 30) // 30 dias
        await tokenRepository.save(storeId, newToken, newRefreshToken, expiresAt)
      }

      // Criar gateway com tokens do banco ou fallback do env
      const gateway = new MelhorEnvioGateway(
        tokens?.access_token || process.env.MELHOR_ENVIO_API_TOKEN || undefined,
        tokens?.refresh_token,
        tokens?.expires_at,
        tokens ? onTokenRefresh : undefined
      )
      const pickupPointRepository = new PickupPointRepository()

      const result = await getDeliveryOptionsUseCase(validated, storeId, {
        shippingGateway: gateway,
        pickupPointRepository
      })

      await reply.status(200).send(result)
    } catch (error) {
      request.log.error(error, 'Erro ao buscar opções de entrega')

      if (error instanceof z.ZodError) {
        await reply.status(400).send({
          error: 'Validation error',
          details: error.errors
        })
        return
      }

      if (error instanceof Error) {
        await reply.status(400).send({
          error: error.message
        })
        return
      }

      await reply.status(500).send({
        error: 'Erro interno ao buscar opções de entrega'
      })
    }
  }
}

