import type { FastifyRequest, FastifyReply } from 'fastify'
import { WebhookEventsRepository } from '../../../infra/db/repositories/webhook-events-repository'
import { processWebhookEventUseCase } from '../../../application/webhooks/use-cases/process-webhook-event'
import { retryWebhookEventUseCase } from '../../../application/webhooks/use-cases/retry-webhook-event'

export class WebhookController {
  constructor(
    private readonly webhookEventsRepository: WebhookEventsRepository
  ) {}

  async handleWebhook(
    request: FastifyRequest<{ Params: { provider: string } }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const webhookContext = request.webhookContext
      if (!webhookContext) {
        await reply.code(400).send({ error: 'Webhook context not found' })
        return
      }

      const { provider, storeId, signatureValid } = webhookContext

      // Obter payload do body (já parseado pelo parser customizado)
      const payload = request.body as Record<string, unknown> | undefined
      if (!payload || typeof payload !== 'object') {
        await reply.code(400).send({ error: 'Invalid request body' })
        return
      }

      // Extrair event type do payload
      const eventType = extractEventType(provider, payload)

      // Criar evento no banco
      const event = await this.webhookEventsRepository.create({
        storeId,
        provider,
        eventType,
        payload,
        signatureValid
      })

      // Processar evento (assíncrono, não bloqueia resposta)
      if (signatureValid) {
        // Processar em background (não aguardar)
        processWebhookEventUseCase(
          {
            eventId: event.id,
            provider,
            storeId,
            payload,
            signatureValid
          },
          {
            webhookEventsRepository: this.webhookEventsRepository
          }
        ).catch((error) => {
          console.error('[Webhook] Error processing event:', error)
        })
      } else {
        // Se assinatura inválida, marcar como failed imediatamente
        await this.webhookEventsRepository.markAsFailed(
          event.id,
          storeId,
          'Invalid signature'
        )
      }

      // Sempre retornar 200 OK (webhook recebido e logado)
      await reply.code(200).send({ received: true, eventId: event.id })
    } catch (error) {
      console.error('[Webhook] Error handling webhook:', error)
      if (error instanceof Error) {
        await reply.code(500).send({ error: error.message })
        return
      }
      await reply.code(500).send({ error: 'Internal server error' })
    }
  }

  async retryWebhook(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const storeId = request.storeId
      if (!storeId) {
        await reply.code(400).send({ error: 'Store ID is required' })
        return
      }

      const { id } = request.params

      await retryWebhookEventUseCase(
        id,
        storeId,
        {
          webhookEventsRepository: this.webhookEventsRepository,
          processWebhookEventDependencies: {
            webhookEventsRepository: this.webhookEventsRepository
          }
        }
      )

      // Buscar evento atualizado para retornar status
      const event = await this.webhookEventsRepository.findById(id, storeId)
      if (!event) {
        await reply.code(404).send({ error: 'Webhook event not found' })
        return
      }

      await reply.code(200).send({
        retried: true,
        eventId: event.id,
        newStatus: event.status
      })
    } catch (error) {
      if (error instanceof Error) {
        const statusCode = error.message.includes('not found') ? 404 : 500
        await reply.code(statusCode).send({ error: error.message })
        return
      }
      await reply.code(500).send({ error: 'Internal server error' })
    }
  }
}

function extractEventType(
  provider: string,
  payload: Record<string, unknown>
): string | null {
  switch (provider) {
    case 'mercadopago':
      return (payload.type as string | undefined) ?? null
    case 'pagseguro':
      return (payload.event as string | undefined) ?? null
    default:
      return (payload.type as string | undefined) ??
        (payload.event as string | undefined) ??
        null
  }
}

