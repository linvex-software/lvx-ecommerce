import type { ShippingCalculationInput, ShippingCalculationResult } from './types'

export interface ShippingGateway {
  calculateShipping(input: ShippingCalculationInput): Promise<ShippingCalculationResult>
}

