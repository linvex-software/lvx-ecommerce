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
  switch (eventType) {
    case 'payment':
    case 'payment.created':
    case 'payment.updated':
      // Processar webhook de pagamento
      if (payload.data && typeof payload.data === 'object') {
        const data = payload.data as Record<string, unknown>
        
        // Verificar se é relacionado a venda física
        const metadata = data.metadata as Record<string, unknown> | undefined
        const externalReference = data.external_reference as string | undefined
        if (metadata?.sale_type === 'physical_sale' || (typeof externalReference === 'string' && externalReference.includes('physical_sale'))) {
          const { processPhysicalSaleWebhookUseCase } = await import('../../physical-sales/use-cases/process-physical-sale-webhook')
          const { PhysicalSaleRepository } = await import('../../../infra/db/repositories/physical-sale-repository')
          const storeId = metadata?.store_id as string | undefined
          if (storeId) {
            await processPhysicalSaleWebhookUseCase(
              data as Record<string, unknown>,
              storeId,
              {
                physicalSaleRepository: new PhysicalSaleRepository()
              }
            )
          }
        } else {
          // Processar webhook de pagamento de pedido
          const { processPaymentWebhookUseCase } = await import('../../payments/use-cases/process-payment-webhook')
          const { TransactionRepository } = await import('../../../infra/db/repositories/transaction-repository')
          const { OrderRepository } = await import('../../../infra/db/repositories/order-repository')
          
          // Extrair store_id do metadata ou external_reference
          const metadata = data.metadata as Record<string, unknown> | undefined
          const storeId = metadata?.store_id as string | undefined
          if (storeId && data.id) {
            await processPaymentWebhookUseCase(
              {
                id: String(data.id),
                status: String(data.status || ''),
                status_detail: String(data.status_detail || ''),
                transaction_amount: data.transaction_amount as number | undefined,
                external_reference: data.external_reference as string | undefined,
                metadata: data.metadata as { order_id?: string; store_id?: string } | undefined
              },
              storeId,
              {
                transactionRepository: new TransactionRepository(),
                orderRepository: new OrderRepository()
              }
            )
          }
        }
      }
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
      // Verificar se é relacionado a venda física
      if (payload.transaction && typeof payload.transaction === 'object') {
        const transaction = payload.transaction as Record<string, unknown>
        const reference = transaction.reference as string | undefined
        if (typeof reference === 'string' && reference.includes('physical_sale')) {
          // Processar webhook de venda física
          const { processPhysicalSaleWebhookUseCase } = await import('../../physical-sales/use-cases/process-physical-sale-webhook')
          const { PhysicalSaleRepository } = await import('../../../infra/db/repositories/physical-sale-repository')
          const storeId = transaction.store_id as string | undefined
          if (storeId) {
            await processPhysicalSaleWebhookUseCase(
              transaction as Record<string, unknown>,
              storeId,
              {
                physicalSaleRepository: new PhysicalSaleRepository()
              }
            )
          }
        }
      }
      break
    default:
      // Event type desconhecido - silenciosamente ignorado
      break
  }
}

