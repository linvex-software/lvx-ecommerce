import type { TransactionRepository } from '../../../infra/db/repositories/transaction-repository'
import type { OrderRepository } from '../../../infra/db/repositories/order-repository'

export interface ProcessPaymentWebhookDependencies {
  transactionRepository: TransactionRepository
  orderRepository: OrderRepository
}

export interface PaymentWebhookData {
  id: string
  status: string
  status_detail: string
  transaction_amount?: number
  external_reference?: string
  metadata?: {
    order_id?: string
    store_id?: string
  }
}

export async function processPaymentWebhookUseCase(
  data: PaymentWebhookData,
  storeId: string,
  dependencies: ProcessPaymentWebhookDependencies
): Promise<void> {
  const { transactionRepository, orderRepository } = dependencies

  // Extrair order_id do external_reference ou metadata
  const orderId =
    data.metadata?.order_id ||
    data.external_reference?.split('_')[0] ||
    null

  if (!orderId) {
    throw new Error('Order ID not found in webhook data')
  }

  // Buscar transação pelo provider_transaction_id
  const transaction = await transactionRepository.findByProviderTransactionId(
    data.id,
    storeId
  )

  if (!transaction) {
    // Se não encontrar transação, pode ser um pagamento criado externamente
    // Por enquanto, apenas logar
    console.warn(`Transaction not found for payment ${data.id}`)
    return
  }

  // Mapear status do Mercado Pago para status interno
  const statusMap: Record<string, string> = {
    pending: 'pending',
    approved: 'approved',
    rejected: 'rejected',
    cancelled: 'cancelled',
    refunded: 'refunded',
    charged_back: 'charged_back'
  }

  const newStatus = statusMap[data.status.toLowerCase()] || 'pending'

  // Atualizar status da transação
  await transactionRepository.updateStatus(
    transaction.id,
    storeId,
    newStatus,
    data.id
  )

  // Atualizar status do pedido
  const newPaymentStatus =
    newStatus === 'approved'
      ? 'paid'
      : newStatus === 'pending'
      ? 'pending'
      : 'failed'

  await orderRepository.update(orderId, storeId, {
    payment_status: newPaymentStatus
  })
}



