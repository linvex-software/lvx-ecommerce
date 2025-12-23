import { z } from 'zod'
import type { PaymentGateway } from '../../../domain/payments/gateways'
import type { TransactionRepository } from '../../../infra/db/repositories/transaction-repository'
import type { OrderRepository } from '../../../infra/db/repositories/order-repository'
import type { PaymentMethodRepository } from '../../../infra/db/repositories/payment-method-repository'

const processPaymentSchema = z.object({
  orderId: z.string().uuid(),
  paymentMethod: z.enum(['credit_card', 'debit_card', 'pix']),
  // Dados do pagador
  payer: z.object({
    email: z.string().email(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    identification: z
      .object({
        type: z.string(),
        number: z.string()
      })
      .optional()
  }),
  // Para cartão
  cardToken: z.string().optional(),
  installments: z.number().int().positive().optional(),
  issuerId: z.string().optional(),
  paymentMethodId: z.string().optional()
})

export interface ProcessPaymentDependencies {
  paymentGateway: PaymentGateway
  transactionRepository: TransactionRepository
  orderRepository: OrderRepository
  paymentMethodRepository: PaymentMethodRepository
}

export interface ProcessPaymentResult {
  transactionId: string
  status: string
  paymentResult: {
    id: string
    status: string
    statusDetail: string
    qrCode?: string
    qrCodeBase64?: string
    ticketUrl?: string
  }
}

export async function processPaymentUseCase(
  input: z.infer<typeof processPaymentSchema>,
  storeId: string,
  dependencies: ProcessPaymentDependencies
): Promise<ProcessPaymentResult> {
  const {
    paymentGateway,
    transactionRepository,
    orderRepository,
    paymentMethodRepository
  } = dependencies

  // 1. Validar input
  const validated = processPaymentSchema.parse(input)

  // 2. Buscar pedido
  const order = await orderRepository.findById(validated.orderId, storeId)
  if (!order) {
    throw new Error('Order not found')
  }

  // 3. Verificar se pedido já foi pago
  if (order.payment_status === 'paid') {
    throw new Error('Order already paid')
  }

  // 4. Buscar método de pagamento ativo (já foi buscado no controller, mas validamos novamente aqui)
  const paymentMethod = await paymentMethodRepository.findActive(storeId)
  if (!paymentMethod) {
    throw new Error('No active payment method configured for this store')
  }

  // 5. Criar pagamento no gateway
  // order.total está em reais (string do banco), converter para centavos para o gateway
  const totalInCents = Math.round(Number(order.total) * 100)
  
  const paymentResult = await paymentGateway.createPayment({
    orderId: validated.orderId,
    amount: totalInCents, // converter reais para centavos
    paymentMethod: validated.paymentMethod,
    payer: validated.payer,
    cardToken: validated.cardToken,
    installments: validated.installments,
    issuerId: validated.issuerId,
    paymentMethodId: validated.paymentMethodId,
    description: `Pedido #${order.id}`
  })

  // 6. Criar transação no banco
  // totalInCents está em centavos, o repository vai converter para reais ao salvar
  const transaction = await transactionRepository.create({
    order_id: validated.orderId,
    store_id: storeId,
    payment_method_id: paymentMethod.id,
    amount: totalInCents, // em centavos, será convertido para reais no repository
    status: paymentResult.status,
    provider_transaction_id: paymentResult.id
  })

  // 7. Atualizar status do pedido
  const newPaymentStatus =
    paymentResult.status === 'approved'
      ? 'paid'
      : paymentResult.status === 'pending'
      ? 'pending'
      : 'failed'

  await orderRepository.update(validated.orderId, storeId, {
    payment_status: newPaymentStatus
  })

  return {
    transactionId: transaction.id,
    status: transaction.status,
    paymentResult: {
      id: paymentResult.id,
      status: paymentResult.status,
      statusDetail: paymentResult.statusDetail || '',
      qrCode: paymentResult.qrCode,
      qrCodeBase64: paymentResult.qrCodeBase64,
      ticketUrl: paymentResult.ticketUrl
    }
  }
}

export { processPaymentSchema }


