export interface Payer {
  email: string
  firstName?: string
  lastName?: string
  identification?: {
    type: string
    number: string
  }
}

export interface CreatePaymentInput {
  orderId: string
  amount: number // em centavos
  description?: string
  paymentMethod: 'credit_card' | 'debit_card' | 'pix' | 'boleto'
  paymentMethodId?: string
  cardToken?: string
  installments?: number
  issuerId?: string
  payer: Payer
}

export interface PaymentResult {
  id: string
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'refunded' | 'charged_back'
  statusDetail?: string
  transactionId?: string
  qrCode?: string
  qrCodeBase64?: string
  ticketUrl?: string
  installments?: number
  paymentMethodId?: string
}

export interface PaymentDetails {
  id: string
  status: PaymentResult['status']
  statusDetail: string
  amount: number // em centavos
  transactionId?: string
  createdAt: Date
  updatedAt: Date
}

export interface PaymentGateway {
  createPayment(input: CreatePaymentInput): Promise<PaymentResult>
  getPayment(paymentId: string): Promise<PaymentDetails | null>
}

