import { WebhookEventsRepository } from '../../../infra/db/repositories/webhook-events-repository'
import type { WebhookEvent } from '../../../domain/webhooks/webhook-types'

export interface ProcessWebhookEventDependencies {
  webhookEventsRepository: WebhookEventsRepository
}

export interface ProcessWebhookEventInput {
  eventId: string
  provider: string
  storeId: string
  payload: Record<string, unknown>
  signatureValid: boolean
}

export async function processWebhookEventUseCase(
  input: ProcessWebhookEventInput,
  dependencies: ProcessWebhookEventDependencies
): Promise<void> {
  const { webhookEventsRepository } = dependencies

  // Se assinatura inválida, marcar como failed
  if (!input.signatureValid) {
    await webhookEventsRepository.markAsFailed(
      input.eventId,
      input.storeId,
      'Invalid signature'
    )
    return
  }

  try {
    // Extrair event type do payload (formato varia por provider)
    const eventType = extractEventType(input.provider, input.payload)

    // Processar evento baseado no provider e tipo
    await handleWebhookByProvider(input.provider, eventType, input.payload)

    // Marcar como processado
    await webhookEventsRepository.markAsProcessed(input.eventId, input.storeId)
  } catch (error) {
    // Em caso de erro, marcar como failed
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'
    await webhookEventsRepository.markAsFailed(
      input.eventId,
      input.storeId,
      errorMessage
    )
    throw error
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

async function handleWebhookByProvider(
  provider: string,
  eventType: string | null,
  payload: Record<string, unknown>
): Promise<void> {
  // Simulação de handlers por provider/eventType
  // No futuro, aqui será a integração real com os handlers específicos
  switch (provider) {
    case 'mercadopago':
      await handleMercadoPagoEvent(eventType, payload)
      break
    case 'pagseguro':
      await handlePagSeguroEvent(eventType, payload)
      break
    default:
      // Provider desconhecido - silenciosamente ignorado
      break
  }
}

async function handleMercadoPagoEvent(
  eventType: string | null,
  payload: Record<string, unknown>
): Promise<void> {
  // Handler simulado para Mercado Pago
  // TODO: Implementar lógica real de processamento de pagamento
  switch (eventType) {
    case 'payment':
    case 'payment.created':
      // Processar pagamento
      break
    default:
      // Event type desconhecido - silenciosamente ignorado
      break
  }
}

async function handlePagSeguroEvent(
  eventType: string | null,
  payload: Record<string, unknown>
): Promise<void> {
  // Handler simulado para PagSeguro
  // TODO: Implementar lógica real de processamento de transação
  switch (eventType) {
    case 'TRANSACTION':
    case 'transaction.paid':
      // Processar transação
      break
    default:
      // Event type desconhecido - silenciosamente ignorado
      break
  }
}

