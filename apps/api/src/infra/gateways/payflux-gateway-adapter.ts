import type {
  PaymentGateway,
  CreatePaymentInput,
  PaymentResult,
  PaymentDetails
} from '../../domain/payments/types'
import type { PaymentMethod } from '../db/repositories/payment-method-repository'
import { MercadoPagoGateway } from './mercado-pago-gateway'

// Interfaces para Payflux (devido a problemas de compatibilidade ESM/CommonJS)
interface IPayfluxSettings {
  paypal?: {
    mode: 'sandbox' | 'live'
    client_id: string
    client_secret: string
  }
  mercadopago?: {
    mode: 'sandbox' | 'live'
    accessToken: string
  }
  stripe?: {
    public_key: string
    secret_key: string
    methods: string[]
  }
}

interface IPayment {
  email?: string | null
  method: string
  intent: string
  description: string
  items: Array<{
    sku?: string
    name: string
    price: string
    currency: string
    quantity: number
  }>
  return_url: string
  cancel_url: string
}

interface IPaymentResult {
  id?: string
  method: string
  intent: string
  description: string
  items: Array<unknown>
  url?: string
  status: string
}

/**
 * Adapter que implementa PaymentGateway usando Payflux ou gateways específicos
 * 
 * Para Mercado Pago: mantém a lógica atual do MercadoPagoGateway (pagamentos diretos com token)
 * Para Stripe: usa Payflux que cria checkout sessions (carregado dinamicamente)
 */
export class PayfluxGatewayAdapter implements PaymentGateway {
  private readonly provider: string
  private readonly mercadoPagoGateway?: MercadoPagoGateway
  private readonly stripeConfig?: {
    publicKey: string
    secretKey: string
  }

  constructor(paymentMethod: PaymentMethod) {
    this.provider = paymentMethod.provider
    const config = paymentMethod.config_json as Record<string, unknown> | null

    if (!config) {
      throw new Error(`Configuration missing for payment method ${paymentMethod.provider}`)
    }

    // Para Mercado Pago, usa o gateway atual (suporta pagamentos diretos)
    if (paymentMethod.provider === 'mercadopago') {
      const accessToken =
        (config.access_token as string) ||
        (config.accessToken as string) ||
        (config.accessTokenProd as string) ||
        (config.access_token_prod as string)

      if (!accessToken) {
        throw new Error('Mercado Pago access token not configured')
      }

      this.mercadoPagoGateway = new MercadoPagoGateway(accessToken)
    }
    // Para Stripe, armazena configurações para usar depois
    else if (paymentMethod.provider === 'stripe') {
      const publicKey = (config.public_key as string) || (config.publicKey as string)
      const secretKey = (config.secret_key as string) || (config.secretKey as string)

      if (!publicKey || !secretKey) {
        throw new Error('Stripe credentials not configured')
      }

      this.stripeConfig = { publicKey, secretKey }
    } else {
      throw new Error(`Unsupported payment provider: ${paymentMethod.provider}`)
    }
  }

  async createPayment(input: CreatePaymentInput): Promise<PaymentResult> {
    // Mercado Pago usa o gateway atual (suporta pagamentos diretos com token)
    if (this.provider === 'mercadopago' && this.mercadoPagoGateway) {
      return await this.mercadoPagoGateway.createPayment(input)
    }

    // Stripe usa Payflux (cria checkout session) - carregado dinamicamente
    if (this.provider === 'stripe' && this.stripeConfig) {
      try {
        // Carregar Payflux dinamicamente para evitar problemas de importação
        const PayfluxModule = await import('payflux')
        const PayfluxClass = PayfluxModule.Payflux as any

        const settings: IPayfluxSettings = {
          stripe: {
            public_key: this.stripeConfig.publicKey,
            secret_key: this.stripeConfig.secretKey,
            methods: ['card']
          }
        }

        const payflux = new PayfluxClass(settings)

        // Converter CreatePaymentInput para formato Payflux
        const payfluxPayment: IPayment = {
          email: input.payer.email,
          method: 'stripe',
          intent: 'sale',
          description: input.description || `Order ${input.orderId}`,
          items: [
            {
              sku: input.orderId,
              name: input.description || `Order ${input.orderId}`,
              price: (input.amount / 100).toString(), // Converter centavos para reais
              currency: 'BRL',
              quantity: 1
            }
          ],
          return_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/checkout/success?orderId=${input.orderId}`,
          cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/checkout?orderId=${input.orderId}`
        }

        const result = await payflux.createPayment(payfluxPayment)

        // Converter resultado Payflux para PaymentResult
        // Payflux retorna uma URL de checkout session para Stripe
        // Usamos ticketUrl para armazenar a URL de redirecionamento
        return {
          id: result.id || '',
          status: 'pending',
          ticketUrl: result.url, // URL da checkout session do Stripe
          statusDetail: 'checkout_session_created'
        }
      } catch (error) {
        console.error('[PayfluxGatewayAdapter] Erro ao criar pagamento Stripe:', error)
        throw new Error(`Erro ao criar pagamento Stripe: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
      }
    }

    throw new Error(`Payment method ${this.provider} not implemented`)
  }

  async getPayment(paymentId: string): Promise<PaymentDetails | null> {
    // Para Mercado Pago, usa o gateway atual
    if (this.provider === 'mercadopago' && this.mercadoPagoGateway) {
      return await this.mercadoPagoGateway.getPayment(paymentId)
    }

    // Para Stripe via Payflux, precisaríamos implementar usando Stripe SDK diretamente
    // já que Payflux não tem método getPayment. Por enquanto, lançamos erro
    if (this.provider === 'stripe') {
      throw new Error('getPayment not implemented for Stripe via Payflux')
    }

    throw new Error(`Payment method ${this.provider} not implemented`)
  }

  private mapStatus(status: string): PaymentResult['status'] {
    const statusMap: Record<string, PaymentResult['status']> = {
      pending: 'pending',
      approved: 'approved',
      rejected: 'rejected',
      cancelled: 'cancelled',
      refunded: 'refunded',
      charged_back: 'charged_back',
      complete: 'approved',
      open: 'pending'
    }

    return statusMap[status.toLowerCase()] || 'pending'
  }
}
