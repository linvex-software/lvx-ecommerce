import { WebhookEventsRepository } from '../../../infra/db/repositories/webhook-events-repository'
import { processWebhookEventUseCase } from './process-webhook-event'
import type { ProcessWebhookEventDependencies } from './process-webhook-event'

export interface RetryWebhookEventDependencies {
  webhookEventsRepository: WebhookEventsRepository
  processWebhookEventDependencies: ProcessWebhookEventDependencies
}

export async function retryWebhookEventUseCase(
  eventId: string,
  storeId: string,
  dependencies: RetryWebhookEventDependencies
): Promise<void> {
  const { webhookEventsRepository, processWebhookEventDependencies } =
    dependencies

  // Buscar evento
  const event = await webhookEventsRepository.findById(eventId, storeId)
  if (!event) {
    throw new Error('Webhook event not found')
  }

  // Incrementar tentativas
  await webhookEventsRepository.incrementAttempts(eventId, storeId)

  // Reprocessar evento
  await processWebhookEventUseCase(
    {
      eventId: event.id,
      provider: event.provider,
      storeId: event.store_id,
      payload: event.payload,
      signatureValid: event.signature_valid
    },
    processWebhookEventDependencies
  )
}

