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

        // Validar formato básico do token (deve começar com algo válido)
        const tokenStr = String(input.cardToken).trim()
        if (!tokenStr || tokenStr.length < 10) {
          throw new Error('Card token appears to be invalid. Please try again with a fresh token.')
        }

        paymentData.token = tokenStr
        paymentData.installments = input.installments || 1
        
        // payment_method_id é obrigatório para pagamentos com cartão
        if (!input.paymentMethodId) {
          throw new Error('payment_method_id is required for card payments')
        }
        paymentData.payment_method_id = input.paymentMethodId

        if (input.issuerId) {
          paymentData.issuer_id = input.issuerId
        }

        // Log para debug (não logar o token completo por segurança)
        console.log('[MercadoPagoGateway] Criando pagamento com cartão:', {
          payment_method_id: input.paymentMethodId,
          installments: paymentData.installments,
          issuer_id: input.issuerId,
          token_length: tokenStr.length,
          token_prefix: tokenStr.substring(0, 5) + '...'
        })
      } else if (input.paymentMethod === 'pix') {
        paymentData.payment_method_id = 'pix'
        // PIX não precisa de token
      }

      // Log do payload antes de enviar (sem dados sensíveis)
      console.log('[MercadoPagoGateway] Payload do pagamento:', {
        transaction_amount: paymentData.transaction_amount,
        payment_method_id: paymentData.payment_method_id,
        installments: paymentData.installments,
        has_token: !!paymentData.token,
        payer_email: paymentData.payer.email
      })

      // Criar pagamento com idempotency key
      const payment = await this.client.create({
        body: paymentData,
        requestOptions: {
          idempotencyKey
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
        const mpError = error.cause[0].description
        
        // Tratar erro específico de token inválido
        if (mpError.includes('Invalid card_token_id') || mpError.includes('invalid card_token')) {
          throw new Error(
            'Token do cartão inválido ou expirado. ' +
            'Por favor, tente novamente - o token pode ter expirado ou foi gerado incorretamente. ' +
            'Certifique-se de que está usando credenciais do mesmo ambiente (teste ou produção).'
          )
        }
        
        throw new Error(`Erro do Mercado Pago: ${mpError}`)
      }

      // Verificar se a mensagem de erro contém informações sobre token inválido
      const errorMessage = error?.message || ''
      if (errorMessage.includes('Invalid card_token_id') || errorMessage.includes('invalid card_token')) {
        throw new Error(
          'Token do cartão inválido ou expirado. ' +
          'Por favor, tente novamente - o token pode ter expirado ou foi gerado incorretamente.'
        )
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
}

