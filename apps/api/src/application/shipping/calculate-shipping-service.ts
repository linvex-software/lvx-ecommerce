import type { ShippingGateway } from '../../domain/shipping/gateways'
import type {
  ShippingCalculationInput,
  ShippingCalculationResult
} from '../../domain/shipping/types'

export interface CalculateShippingDependencies {
  shippingGateway: ShippingGateway
}

export class CalculateShippingService {
  constructor(private readonly dependencies: CalculateShippingDependencies) {}

  async execute(
    input: ShippingCalculationInput
  ): Promise<ShippingCalculationResult> {
    // Validação básica
    if (!input.destinationZipCode || input.destinationZipCode.trim().length === 0) {
      throw new Error('CEP de destino é obrigatório')
    }

    const cleanZipCode = input.destinationZipCode.replace(/\D/g, '')
    if (cleanZipCode.length !== 8) {
      throw new Error('CEP deve conter 8 dígitos')
    }

    if (!input.items || input.items.length === 0) {
      throw new Error('É necessário pelo menos um item para calcular o frete')
    }

    // Validação de itens
    for (const item of input.items) {
      if (item.quantity <= 0) {
        throw new Error('Quantidade deve ser maior que zero')
      }
      if (item.weight < 0) {
        throw new Error('Peso não pode ser negativo')
      }
      if (item.height < 0 || item.width < 0 || item.length < 0) {
        throw new Error('Dimensões não podem ser negativas')
      }
    }

    return this.dependencies.shippingGateway.calculateShipping({
      ...input,
      destinationZipCode: cleanZipCode
    })
  }
}

