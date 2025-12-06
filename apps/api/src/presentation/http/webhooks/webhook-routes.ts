import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { WebhookController } from './webhook-controller'
import { WebhookEventsRepository } from '../../../infra/db/repositories/webhook-events-repository'
import { tenantMiddleware } from '../../../infra/http/middlewares/tenant'
import { validateWebhookSignature } from '../../../infra/http/middlewares/validate-webhook-signature'
import { requireAuth, requireRole } from '../../../infra/http/middlewares/auth'

export async function registerWebhookRoutes(app: FastifyInstance): Promise<void> {
  const webhookEventsRepository = new WebhookEventsRepository()
  const webhookController = new WebhookController(webhookEventsRepository)

  // POST /webhooks/:provider - Recebe webhooks de qualquer provider
  app.post<{ Params: { provider: string } }>(
    '/webhooks/:provider',
    {
      onRequest: [tenantMiddleware],
      preHandler: [validateWebhookSignature]
    },
    async (
      request: FastifyRequest<{ Params: { provider: string } }>,
      reply: FastifyReply
    ) => {
      await webhookController.handleWebhook(request, reply)
    }
  )

  // POST /admin/webhooks/:id/retry - Retenta um webhook falho (protegida)
  app.post<{ Params: { id: string } }>(
    '/admin/webhooks/:id/retry',
    {
      onRequest: [requireAuth, tenantMiddleware],
      preHandler: [requireRole(['admin', 'operador'])]
    },
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      await webhookController.retryWebhook(request, reply)
    }
  )
}

