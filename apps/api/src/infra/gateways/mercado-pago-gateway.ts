import { MercadoPagoConfig, Payment } from 'mercadopago'
import type {
  PaymentGateway,
  CreatePaymentInput,
  PaymentResult,
  PaymentDetails
} from '../../domain/payments/types'
import { v4 as uuidv4 } from 'uuid'

export class MercadoPagoGateway implements PaymentGateway {
  private readonly client: Payment
  private readonly accessToken: string

  constructor(accessToken: string) {
    this.accessToken = accessToken
    const config = new MercadoPagoConfig({
      accessToken: this.accessToken,
      options: {
        timeout: 30000, // 30 segundos
        idempotencyKey: uuidv4()
      }
    })
    this.client = new Payment(config)
  }

  async createPayment(input: CreatePaymentInput): Promise<PaymentResult> {
    try {
      // Gerar X-Idempotency-Key (UUID V4 sem prefixo)
      const idempotencyKey = uuidv4()

      const paymentData: any = {
        transaction_amount: input.amount / 100, // Converter centavos para reais
        description: input.description || `Pedido ${input.orderId}`,
        payment_method_id: input.paymentMethodId || input.paymentMethod,
        external_reference: input.orderId, // Incluir order_id para webhook
        metadata: {
          order_id: input.orderId
        },
        payer: {
          email: input.payer.email
        }
      }

      // Adicionar dados do pagador
      if (input.payer.firstName || input.payer.lastName) {
        paymentData.payer.first_name = input.payer.firstName || ''
        paymentData.payer.last_name = input.payer.lastName || ''
      }

      if (input.payer.identification) {
        paymentData.payer.identification = {
          type: input.payer.identification.type,
          number: input.payer.identification.number
        }
      }

      // Configurações específicas por tipo de pagamento
      if (input.paymentMethod === 'credit_card' || input.paymentMethod === 'debit_card') {
        if (!input.cardToken) {
          throw new Error('Card token is required for card payments')
        }

        paymentData.token = input.cardToken
        paymentData.installments = input.installments || 1
        paymentData.payment_method_id = input.paymentMethodId

        if (input.issuerId) {
          paymentData.issuer_id = input.issuerId
        }
      } else if (input.paymentMethod === 'pix') {
        paymentData.payment_method_id = 'pix'
        // PIX não precisa de token
      }

      // Criar pagamento com idempotency key
      const payment = await this.client.create({
        body: paymentData,
        requestOptions: {
          idempotencyKey,
          customHeaders: {
            'X-Idempotency-Key': idempotencyKey
          }
        }
      })

      return this.mapPaymentToResult(payment)
    } catch (error: any) {
      // Log detalhado do erro para debug
      console.error('[MercadoPagoGateway] Erro ao criar pagamento:', error)

      // Verificar erros específicos do Mercado Pago
      if (error?.error === 'unauthorized' || error?.status === 401) {
        const message = error?.message || error?.cause?.[0]?.description || 'Erro de autenticação'
        if (message.includes('live credentials') || message.includes('Unauthorized use of live credentials')) {
          throw new Error(
            'Erro de autenticação: Credenciais inválidas ou expiradas. ' +
            'Verifique se você está usando as credenciais corretas da seção de TESTE no painel do Mercado Pago. ' +
            'Acesse https://www.mercadopago.com.br/developers/panel/credentials para verificar suas credenciais.'
          )
        }
        throw new Error(`Erro de autenticação no Mercado Pago: ${message}. Verifique se suas credenciais estão corretas.`)
      }

      if (error instanceof Error) {
        // Verificar se é timeout
        if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
          throw new Error('Timeout ao criar pagamento no Mercado Pago. Tente novamente.')
        }
        // Verificar se é erro de rede
        if (error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND')) {
          throw new Error('Erro de conexão com Mercado Pago. Verifique sua conexão.')
        }
        throw new Error(`Erro ao criar pagamento no Mercado Pago: ${error.message}`)
      }

      // Verificar se é erro do Mercado Pago com estrutura específica
      if (error?.cause?.[0]?.description) {
        throw new Error(`Erro do Mercado Pago: ${error.cause[0].description}`)
      }

      throw new Error('Erro desconhecido ao criar pagamento no Mercado Pago')
    }
  }

  async getPayment(paymentId: string): Promise<PaymentDetails | null> {
    try {
      const payment = await this.client.get({ id: paymentId })

      if (!payment) {
        return null
      }

      return {
        id: String(payment.id || ''),
        status: this.mapStatus(payment.status || ''),
        statusDetail: payment.status_detail || '',
        amount: payment.transaction_amount ? Math.round(payment.transaction_amount * 100) : 0,
        transactionId: payment.transaction_details?.transaction_id || undefined,
        createdAt: payment.date_created ? new Date(payment.date_created) : new Date(),
        updatedAt: payment.date_last_updated ? new Date(payment.date_last_updated) : new Date()
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Erro ao buscar pagamento no Mercado Pago: ${error.message}`)
      }
      throw new Error('Erro desconhecido ao buscar pagamento no Mercado Pago')
    }
  }

  private mapPaymentToResult(payment: any): PaymentResult {
    const status = this.mapStatus(payment.status || '')

    const result: PaymentResult = {
      id: String(payment.id || ''),
      status,
      statusDetail: payment.status_detail || '',
      transactionId: payment.transaction_details?.transaction_id || undefined
    }

    // Adicionar dados específicos do PIX
    if (payment.payment_method_id === 'pix' && payment.point_of_interaction) {
      const transactionData = payment.point_of_interaction.transaction_data
      if (transactionData) {
        result.qrCode = transactionData.qr_code
        result.qrCodeBase64 = transactionData.qr_code_base64
        result.ticketUrl = transactionData.ticket_url
      }
    }

    // Adicionar dados específicos do cartão
    if (payment.installments) {
      result.installments = payment.installments
    }
    if (payment.payment_method_id) {
      result.paymentMethodId = payment.payment_method_id
    }

    return result
  }

  private mapStatus(status: string): PaymentResult['status'] {
    const statusMap: Record<string, PaymentResult['status']> = {
      pending: 'pending',
      approved: 'approved',
      rejected: 'rejected',
      cancelled: 'cancelled',
      refunded: 'refunded',
      charged_back: 'charged_back'
    }

    return statusMap[status.toLowerCase()] || 'pending'
  }

  /**
   * Cria uma order usando a Orders API do Mercado Pago
   * Usado pelo Card Payment Brick
   */
  async createOrder(orderData: {
    type: 'online'
    processing_mode: 'automatic' | 'manual'
    total_amount: string
    external_reference: string
    payer: {
      email: string
      identification?: {
        type: string
        number: string
      }
    }
    transactions: {
      payments: Array<{
        amount: string
        payment_method: {
          id: string
          type: 'credit_card' | 'debit_card'
          token: string
          installments: number
        }
      }>
    }
  }): Promise<{
    id: string
    status: string
    status_detail: string
    total_amount: string
    total_paid_amount: string
    transactions: {
      payments: Array<{
        id: string
        status: string
        status_detail: string
        amount: string
        paid_amount: string
        payment_method: {
          id: string
          type: string
          token: string
          installments: number
        }
      }>
    }
  }> {
    try {
      // Gerar X-Idempotency-Key (UUID V4)
      const idempotencyKey = uuidv4()

      // Fazer requisição HTTP direta para Orders API
      // O SDK do Mercado Pago pode não ter suporte direto para Orders API
      const response = await fetch('https://api.mercadopago.com/v1/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`,
          'X-Idempotency-Key': idempotencyKey
        },
        body: JSON.stringify(orderData)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('[MercadoPagoGateway] Erro ao criar order:', errorData)

        // Verificar erros específicos
        if (response.status === 401) {
          const message = errorData?.message || errorData?.cause?.[0]?.description || 'Erro de autenticação'
          if (message.includes('live credentials') || message.includes('Unauthorized use of live credentials')) {
            throw new Error(
              'Erro de autenticação: Credenciais inválidas ou expiradas. ' +
              'Verifique se você está usando as credenciais corretas da seção de TESTE no painel do Mercado Pago. ' +
              'Acesse https://www.mercadopago.com.br/developers/panel/credentials para verificar suas credenciais.'
            )
          }
          throw new Error(`Erro de autenticação no Mercado Pago: ${message}. Verifique se suas credenciais estão corretas.`)
        }

        if (response.status === 400) {
          const message = errorData?.message || errorData?.cause?.[0]?.description || 'Erro na requisição'
          throw new Error(`Erro ao criar order no Mercado Pago: ${message}`)
        }

        throw new Error(`Erro ao criar order no Mercado Pago: Status ${response.status}`)
      }

      const order = await response.json()
      return order
    } catch (error: any) {
      console.error('[MercadoPagoGateway] Erro ao criar order:', error)

      if (error instanceof Error) {
        // Verificar se é timeout
        if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
          throw new Error('Timeout ao criar order no Mercado Pago. Tente novamente.')
        }
        // Verificar se é erro de rede
        if (error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND')) {
          throw new Error('Erro de conexão com Mercado Pago. Verifique sua conexão.')
        }
        // Se já é um erro formatado, re-lançar
        if (error.message.includes('Erro')) {
          throw error
        }
        throw new Error(`Erro ao criar order no Mercado Pago: ${error.message}`)
      }

      throw new Error('Erro desconhecido ao criar order no Mercado Pago')
    }
  }
}

