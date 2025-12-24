import type { FastifyRequest, FastifyReply } from 'fastify'
import { CalculateShippingService } from '../../../application/shipping/calculate-shipping-service'
import { MelhorEnvioGateway } from '../../../infra/gateways/melhor-envio-gateway'
import { MelhorEnvioTokenRepository } from '../../../infra/db/repositories/melhor-envio-token-repository'
import type { ShippingCalculationInput } from '../../../domain/shipping/types'

interface CalculateShippingBody {
  destination_zip_code: string
  items: Array<{
    quantity: number
    weight: number
    height: number
    width: number
    length: number
  }>
}

export class ShippingController {
  async calculate(
    request: FastifyRequest<{ Body: CalculateShippingBody }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const { destination_zip_code, items } = request.body

      const storeId = (request as any).storeId
      if (!storeId) {
        await reply.code(400).send({ error: 'Store ID is required' })
        return
      }

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
      const service = new CalculateShippingService({ shippingGateway: gateway })

      const input: ShippingCalculationInput = {
        destinationZipCode: destination_zip_code,
        items
      }

      const result = await service.execute(input)

      await reply.status(200).send(result)
    } catch (error) {
      request.log.error(error, 'Erro ao calcular frete')

      if (error instanceof Error) {
        await reply.status(400).send({
          error: error.message
        })
        return
      }

      await reply.status(500).send({
        error: 'Erro interno ao calcular frete'
      })
    }
  }
}

