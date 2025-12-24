import type { PaymentGateway } from '../../domain/payments/gateways'
import type { PaymentMethod } from '../db/repositories/payment-method-repository'
import { PayfluxGatewayAdapter } from './payflux-gateway-adapter'

/**
 * Factory para criar instâncias de PaymentGateway baseado no provider configurado
 */
export class PaymentGatewayFactory {
  /**
   * Cria uma instância do gateway de pagamento baseado no método de pagamento
   */
  static create(paymentMethod: PaymentMethod): PaymentGateway {
    if (!paymentMethod.active) {
      throw new Error(`Payment method ${paymentMethod.provider} is not active`)
    }

    return new PayfluxGatewayAdapter(paymentMethod)
  }
}








