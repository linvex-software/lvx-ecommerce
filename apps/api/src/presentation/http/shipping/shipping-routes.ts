import type { FastifyInstance } from 'fastify'
import { ShippingController } from './shipping-controller'
import { tenantMiddleware } from '../../../infra/http/middlewares/tenant'

export async function registerShippingRoutes(
  app: FastifyInstance
): Promise<void> {
  const shippingController = new ShippingController()

  // POST /shipping/calculate - Calcula opções de frete
  app.post<{
    Body: {
      destination_zip_code: string
      items: Array<{
        quantity: number
        weight: number
        height: number
        width: number
        length: number
      }>
    }
  }>(
    '/shipping/calculate',
    {
      onRequest: [tenantMiddleware]
    },
    async (request, reply) => {
      await shippingController.calculate(request, reply)
    }
  )
}

