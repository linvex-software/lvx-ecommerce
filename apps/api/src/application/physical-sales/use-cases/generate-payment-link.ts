import { z } from 'zod'
import { OrderRepository } from '../../../infra/db/repositories/order-repository'
import { PaymentMethodRepository } from '../../../infra/db/repositories/payment-method-repository'
import { MercadoPagoGateway } from '../../../infra/gateways/mercado-pago-gateway'
import type { PaymentGateway } from '../../../domain/payments/gateways'

const generatePaymentLinkSchema = z.object({
  order_id: z.string().uuid(),
  payment_method: z.enum(['pix', 'credit_card', 'debit_card']).optional().default('pix'),
  payer: z
    .object({
      email: z.string().email(),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      identification: z
        .object({
          type: z.string(),
          number: z.string()
        })
        .optional()
    })
    .optional()
})

export interface GeneratePaymentLinkDependencies {
  orderRepository: OrderRepository
  paymentMethodRepository: PaymentMethodRepository
  paymentGateway: PaymentGateway
}

export interface GeneratePaymentLinkResult {
  paymentUrl: string
  qrCode?: string
  qrCodeBase64?: string
  ticketUrl?: string
  transactionId: string
}

export async function generatePaymentLinkUseCase(
  input: z.infer<typeof generatePaymentLinkSchema>,
  storeId: string,
  dependencies: GeneratePaymentLinkDependencies
): Promise<GeneratePaymentLinkResult> {
  const { orderRepository, paymentMethodRepository, paymentGateway } = dependencies

  const validated = generatePaymentLinkSchema.parse(input)

  // Buscar pedido
  const order = await orderRepository.findById(validated.order_id, storeId)
  if (!order) {
    throw new Error('Order not found')
  }

  if (order.payment_status === 'paid') {
    throw new Error('Order already paid')
  }

  // Buscar método de pagamento
  const paymentMethod = await paymentMethodRepository.findByProvider(storeId, 'mercadopago')
  if (!paymentMethod || !paymentMethod.active) {
    throw new Error('Mercado Pago payment method not configured or inactive')
  }

  // Converter total para centavos
  const totalInCents = Math.round(Number(order.total) * 100)

  // Criar pagamento no gateway
  const paymentResult = await paymentGateway.createPayment({
    orderId: validated.order_id,
    amount: totalInCents,
    paymentMethod: validated.payment_method,
    payer: validated.payer ?? {
      email: 'customer@example.com' // fallback
    },
    description: `Pedido PDV #${order.id}`
  })

  // Retornar URL de pagamento
  // Para PIX, retornar QR code
  // Para cartão, retornar URL de redirecionamento
  let paymentUrl = ''
  if (validated.payment_method === 'pix') {
    paymentUrl = paymentResult.qrCode || paymentResult.ticketUrl || ''
  } else {
    paymentUrl = paymentResult.ticketUrl || ''
  }

  return {
    paymentUrl,
    qrCode: paymentResult.qrCode,
    qrCodeBase64: paymentResult.qrCodeBase64,
    ticketUrl: paymentResult.ticketUrl,
    transactionId: paymentResult.id
  }
}

export { generatePaymentLinkSchema }

