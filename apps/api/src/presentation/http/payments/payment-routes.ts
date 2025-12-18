import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { PaymentController } from './payment-controller'
import { processPaymentSchema } from '../../../application/payments/use-cases/process-payment'
import { tenantMiddleware } from '../../../infra/http/middlewares/tenant'

export async function registerPaymentRoutes(app: FastifyInstance): Promise<void> {
  const paymentController = new PaymentController()

  // GET /payments/public-key - Busca chave pública do Mercado Pago (público, apenas tenantMiddleware)
  app.get(
    '/payments/public-key',
    {
      onRequest: [tenantMiddleware]
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      await paymentController.getPublicKey(request, reply)
    }
  )

  // POST /payments/process - Processa pagamento (público, apenas tenantMiddleware)
  app.post<{ Body: z.infer<typeof processPaymentSchema> }>(
    '/payments/process',
    {
      onRequest: [tenantMiddleware]
    },
    async (
      request: FastifyRequest<{ Body: z.infer<typeof processPaymentSchema> }>,
      reply: FastifyReply
    ) => {
      await paymentController.processPayment(request, reply)
    }
  )
}


