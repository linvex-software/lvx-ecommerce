import { z } from 'zod'
import type { PaymentGateway } from '../../../domain/payments/gateways'
import type { TransactionRepository } from '../../../infra/db/repositories/transaction-repository'
import type { OrderRepository } from '../../../infra/db/repositories/order-repository'
import type { PaymentMethodRepository } from '../../../infra/db/repositories/payment-method-repository'

const processOrderSchema = z.object({
  type: z.literal('online'),
  processing_mode: z.enum(['automatic', 'manual']),
  total_amount: z.string().regex(/^\d+\.\d{2}$/, 'Total amount must be in format 00.00'),
  external_reference: z.string().uuid(),
  payer: z.object({
    email: z.string().email(),
    identification: z
      .object({
        type: z.string(),
        number: z.string()
      })
      .optional()
  }),
  transactions: z.object({
    payments: z.array(
      z.object({
        amount: z.string().regex(/^\d+\.\d{2}$/, 'Amount must be in format 00.00'),
        payment_method: z.object({
          id: z.string(),
          type: z.enum(['credit_card', 'debit_card']),
          token: z.string(),
          installments: z.number().int().positive()
        })
      })
    ).min(1)
  })
})

export interface ProcessOrderDependencies {
  paymentGateway: PaymentGateway
  transactionRepository: TransactionRepository
  orderRepository: OrderRepository
  paymentMethodRepository: PaymentMethodRepository
}

export interface ProcessOrderResult {
  orderId: string
  status: string
  statusDetail: string
  totalAmount: string
  totalPaidAmount: string
  payment: {
    id: string
    status: string
    statusDetail: string
    amount: string
    paidAmount: string
  }
}

export async function processOrderUseCase(
  input: z.infer<typeof processOrderSchema>,
  storeId: string,
  dependencies: ProcessOrderDependencies
): Promise<ProcessOrderResult> {
  const {
    paymentGateway,
    transactionRepository,
    orderRepository,
    paymentMethodRepository
  } = dependencies

  // 1. Validar input
  const validated = processOrderSchema.parse(input)

  // 2. Buscar pedido pelo external_reference
  const order = await orderRepository.findById(validated.external_reference, storeId)
  if (!order) {
    throw new Error('Order not found')
  }

  // 3. Verificar se pedido já foi pago
  if (order.payment_status === 'paid') {
    throw new Error('Order already paid')
  }

  // 4. Buscar método de pagamento
  const paymentMethod = await paymentMethodRepository.findByProvider(
    storeId,
    'mercadopago'
  )
  if (!paymentMethod || !paymentMethod.active) {
    throw new Error('Mercado Pago payment method not configured or inactive for this store')
  }

  // 5. Criar order no Mercado Pago usando Orders API
  const mercadoPagoOrder = await paymentGateway.createOrder({
    type: validated.type,
    processing_mode: validated.processing_mode,
    total_amount: validated.total_amount,
    external_reference: validated.external_reference,
    payer: validated.payer,
    transactions: validated.transactions
  })

  // 6. Extrair informações do pagamento da resposta
  const payment = mercadoPagoOrder.transactions.payments[0]
  if (!payment) {
    throw new Error('No payment found in order response')
  }

  // 7. Mapear status do Mercado Pago para status interno
  const paymentStatus = mapMercadoPagoStatus(payment.status)
  const orderPaymentStatus = mapOrderPaymentStatus(mercadoPagoOrder.status)

  // 8. Criar transação no banco
  // Converter amount de string (reais) para centavos
  const amountInCents = Math.round(parseFloat(payment.amount) * 100)
  
  const transaction = await transactionRepository.create({
    order_id: validated.external_reference,
    store_id: storeId,
    payment_method_id: paymentMethod.id,
    amount: amountInCents, // em centavos, será convertido para reais no repository
    status: paymentStatus,
    provider_transaction_id: payment.id
  })

  // 9. Atualizar status do pedido
  await orderRepository.update(validated.external_reference, storeId, {
    payment_status: orderPaymentStatus
  })

  return {
    orderId: mercadoPagoOrder.id,
    status: mercadoPagoOrder.status,
    statusDetail: mercadoPagoOrder.status_detail,
    totalAmount: mercadoPagoOrder.total_amount,
    totalPaidAmount: mercadoPagoOrder.total_paid_amount,
    payment: {
      id: payment.id,
      status: payment.status,
      statusDetail: payment.status_detail,
      amount: payment.amount,
      paidAmount: payment.paid_amount
    }
  }
}

function mapMercadoPagoStatus(status: string): 'pending' | 'approved' | 'rejected' | 'cancelled' | 'refunded' | 'charged_back' {
  const statusMap: Record<string, 'pending' | 'approved' | 'rejected' | 'cancelled' | 'refunded' | 'charged_back'> = {
    pending: 'pending',
    approved: 'approved',
    rejected: 'rejected',
    cancelled: 'cancelled',
    refunded: 'refunded',
    charged_back: 'charged_back',
    processed: 'approved', // Orders API usa 'processed' para aprovado
    accredited: 'approved'
  }

  return statusMap[status.toLowerCase()] || 'pending'
}

function mapOrderPaymentStatus(status: string): 'pending' | 'paid' | 'failed' {
  const statusMap: Record<string, 'pending' | 'paid' | 'failed'> = {
    processed: 'paid',
    pending: 'pending',
    rejected: 'failed',
    cancelled: 'failed'
  }

  return statusMap[status.toLowerCase()] || 'pending'
}

export { processOrderSchema }

