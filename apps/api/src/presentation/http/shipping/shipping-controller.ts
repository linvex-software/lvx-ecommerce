import type { FastifyRequest, FastifyReply } from 'fastify'
import { CalculateShippingService } from '../../../application/shipping/calculate-shipping-service'
import { MelhorEnvioGateway } from '../../../infra/gateways/melhor-envio-gateway'
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

      // Obter token do Melhor Envio (por enquanto do env, futuramente do banco)
      const melhorEnvioToken =
        process.env.MELHOR_ENVIO_API_TOKEN ||
        'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiI5NTYiLCJqdGkiOiI0ZmYyY2U2MzA3ZmI0YTg0MDkzMTRkYjkwYWI4Y2NiMmVkNzZjNWQ3OTRmMjQyNjg3NGUyZjE2MjI1YTZlZDMxOGYyMDlhZmJhNjQ0YWI3YSIsImlhdCI6MTc2NDM1NzU0MS40MjUwNjksIm5iZiI6MTc2NDM1NzU0MS40MjUwNzIsImV4cCI6MTc5NTg5MzU0MS40MTgxOTgsInN1YiI6ImEwNzdhNWJiLTRmMGYtNGU5YS04ZmNjLThkNzgyYTQzMWRlOSIsInNjb3BlcyI6WyJjYXJ0LXJlYWQiLCJjYXJ0LXdyaXRlIiwiY29tcGFuaWVzLXJlYWQiLCJjb21wYW5pZXMtd3JpdGUiLCJjb3Vwb25zLXJlYWQiLCJjb3Vwb25zLXdyaXRlIiwibm90aWZpY2F0aW9ucy1yZWFkIiwib3JkZXJzLXJlYWQiLCJwcm9kdWN0cy1yZWFkIiwicHJvZHVjdHMtZGVzdHJveSIsInByb2R1Y3RzLXdyaXRlIiwicHVyY2hhc2VzLXJlYWQiLCJzaGlwcGluZy1jYWxjdWxhdGUiLCJzaGlwcGluZy1jYW5jZWwiLCJzaGlwcGluZy1jaGVja291dCIsInNoaXBwaW5nLWNvbXBhbmllcyIsInNoaXBwaW5nLWdlbmVyYXRlIiwic2hpcHBpbmctcHJldmlldyIsInNoaXBwaW5nLXByaW50Iiwic2hpcHBpbmctc2hhcmUiLCJzaGlwcGluZy10cmFja2luZyIsImVjb21tZXJjZS1zaGlwcGluZyIsInRyYW5zYWN0aW9ucy1yZWFkIiwidXNlcnMtcmVhZCIsInVzZXJzLXdyaXRlIiwid2ViaG9va3MtcmVhZCIsIndlYmhvb2tzLXdyaXRlIiwid2ViaG9va3MtZGVsZXRlIiwidGRlYWxlci13ZWJob29rIl19.NcPQcu_x3V3NuTbBsqJvQi1BXtod0HRYASIX7KsigkEK93SEU5Uddtk63_t0XDXLrcnup1VIGC1qdw8MHZwkeOANs41w7uv_fPfvF525Cd2t0wBzv-P6xXdTKzS3kdYfmQ6gO4DNutaUDX6BhwcU2jesxcUAPkLB9RQ0iv90-1WAzNhvC7W_0z63dmBDPTh8nbGMeF6OFjn5VzEL6_zk-lwmrfZH0zrgOfImVuu1koJuyLb5dscv-Nxjo6F9wkCezEcIBN0IXZqFyCjfz6myPp8TTQ4YaBBndlMWtNi1Bh9Gpg3LLUwnIiK2S6k_mlU-qRqRFBZEi-OTtN_SkX31VDzlp1cuFcUpHZUCx2eq-vOCKHrPr68OsCG2E6lTNoaxyN7JdIhRogWcYDGN_oOyh307RvBaWoYBritUeuPo4QVp4da0w5JoJ6k7b8MUM0jsbb9bN6-q5WZxTYWsYgU_tJbynULO0ImqNqEhqqJ0B9wfcvVNJmHP2oSs0WfWu9JfDQyGV6rUZRFvLyzABi2CT0VSxtlylmcmuDc3uEFbbjlnfZh-iiYiWRPzMCdgJQ-sXHeS57OZNNE8oxundVUc-qnFIW0j1hoXxFlPlWpbWJYSnexLvPiGKLfpokM5hlz3WUmzNaakU9S39iVpcfLdpU1HtxN1-uz-2f8I1qFTZUs'

      const gateway = new MelhorEnvioGateway(melhorEnvioToken)
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

