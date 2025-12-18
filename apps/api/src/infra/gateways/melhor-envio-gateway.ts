import type { ShippingGateway } from '../../domain/shipping/gateways'
import type {
  ShippingCalculationInput,
  ShippingCalculationResult,
  ShippingQuote
} from '../../domain/shipping/types'

interface MelhorEnvioPackage {
  height: number
  width: number
  length: number
  weight: number
}

interface MelhorEnvioCalculateRequest {
  from: {
    postal_code: string
  }
  to: {
    postal_code: string
  }
  products: MelhorEnvioPackage[]
}

export class MelhorEnvioGateway implements ShippingGateway {
  private readonly apiUrl: string
  private readonly apiToken: string

  constructor(apiToken: string) {
    this.apiToken = apiToken
    this.apiUrl = process.env.MELHOR_ENVIO_API_URL || 'https://sandbox.melhorenvio.com.br/api/v2'
  }

  async calculateShipping(
    input: ShippingCalculationInput
  ): Promise<ShippingCalculationResult> {
    const originZipCode = process.env.SHIPPING_ORIGIN_ZIP_CODE || '01310100'

    // Agrupar itens por dimensões/peso para otimizar pacotes
    const packages = this.groupItemsIntoPackages(input.items)

    const requestBody: MelhorEnvioCalculateRequest = {
      from: {
        postal_code: originZipCode
      },
      to: {
        postal_code: input.destinationZipCode.replace(/\D/g, '')
      },
      products: packages
    }

    try {
      const response = await fetch(`${this.apiUrl}/me/shipment/calculate`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
          'User-Agent': 'WhiteLabelEcommerce/1.0'
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(
          `Melhor Envio API error: ${response.status} - ${errorText}`
        )
      }

      // A resposta da API pode ter campos opcionais, então usamos any temporariamente
      const quotes: any[] = await response.json()

      return {
        quotes: quotes.map((quote) => this.normalizeQuote(quote as ShippingQuote))
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Erro ao calcular frete: ${error.message}`)
      }
      throw new Error('Erro desconhecido ao calcular frete')
    }
  }

  private groupItemsIntoPackages(
    items: ShippingCalculationInput['items']
  ): MelhorEnvioPackage[] {
    // Por enquanto, agrupa todos os itens em um único pacote
    // Futuramente pode implementar lógica mais sofisticada
    const totalWeight = items.reduce(
      (sum, item) => sum + item.weight * item.quantity,
      0
    )

    // Usa as dimensões do maior item como base
    const maxDimensions = items.reduce(
      (max, item) => ({
        height: Math.max(max.height, item.height),
        width: Math.max(max.width, item.width),
        length: Math.max(max.length, item.length)
      }),
      { height: 0, width: 0, length: 0 }
    )

    // Se não houver dimensões definidas, usa valores padrão
    const defaultDimensions = {
      height: maxDimensions.height || 4,
      width: maxDimensions.width || 12,
      length: maxDimensions.length || 17
    }

    return [
      {
        height: defaultDimensions.height,
        width: defaultDimensions.width,
        length: defaultDimensions.length,
        weight: totalWeight || 0.3 // peso padrão em kg se não especificado
      }
    ]
  }

  private normalizeQuote(quote: Partial<ShippingQuote> & { id: number; name: string; price: string | number }): ShippingQuote {
    const price = String(quote.price || '0.00')
    const deliveryTime = (quote.delivery_time as number) || (quote.custom_delivery_time as number) || 0
    
    return {
      id: quote.id,
      name: quote.name,
      price,
      custom_price: String(quote.custom_price || quote.price || '0.00'),
      discount: String(quote.discount || '0.00'),
      currency: quote.currency || 'R$',
      delivery_time: deliveryTime,
      delivery_range: quote.delivery_range || {
        min: deliveryTime,
        max: deliveryTime
      },
      custom_delivery_time: (quote.custom_delivery_time as number) || deliveryTime,
      custom_delivery_range: quote.custom_delivery_range || quote.delivery_range || {
        min: deliveryTime,
        max: deliveryTime
      },
      packages: quote.packages || [],
      additional_services: quote.additional_services || {
        receipt: false,
        own_hand: false,
        collect: false
      },
      company: quote.company || {
        id: 0,
        name: 'Transportadora',
        picture: ''
      }
    }
  }
}

