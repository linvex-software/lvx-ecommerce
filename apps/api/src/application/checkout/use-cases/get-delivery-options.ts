import { z } from 'zod'
import { db, schema } from '@white-label/db'
import { eq } from 'drizzle-orm'
import type { ShippingGateway } from '../../../domain/shipping/gateways'
import type { ShippingCalculationInput } from '../../../domain/shipping/types'
import { PickupPointRepository } from '../../../infra/db/repositories/pickup-point-repository'
import { CalculateShippingService } from '../../shipping/calculate-shipping-service'

export const getDeliveryOptionsSchema = z.object({
  destination_zip_code: z.string().optional(),
  items: z
    .array(
      z.object({
        product_id: z.string().uuid(),
        variant_id: z.string().uuid().optional().nullable(),
        quantity: z.number().int().positive(),
        price: z.number().int().positive() // em centavos
      })
    )
    .min(1)
})

export interface DeliveryOption {
  type: 'shipping' | 'pickup_point'
  id: string // quote.id (number como string) ou pickup_point.id
  name: string
  price: number // em centavos
  description?: string
  delivery_time?: string
  address?: {
    street: string
    number: string
    complement?: string | null
    neighborhood: string
    city: string
    state: string
    zip_code: string
  }
}

export interface GetDeliveryOptionsResult {
  shippingOptions: DeliveryOption[]
  pickupOptions: DeliveryOption[]
}

export interface GetDeliveryOptionsDependencies {
  shippingGateway: ShippingGateway
  pickupPointRepository: PickupPointRepository
}

export async function getDeliveryOptionsUseCase(
  input: z.infer<typeof getDeliveryOptionsSchema>,
  storeId: string,
  dependencies: GetDeliveryOptionsDependencies
): Promise<GetDeliveryOptionsResult> {
  const { shippingGateway, pickupPointRepository } = dependencies

  // 1. Buscar informações da loja (para free_shipping_min_total)
  const [store] = await db
    .select()
    .from(schema.stores)
    .where(eq(schema.stores.id, storeId))
    .limit(1)

  if (!store) {
    throw new Error('Store not found')
  }

  const freeShippingMinTotal = store.free_shipping_min_total
    ? parseFloat(store.free_shipping_min_total)
    : null

  // 2. Calcular subtotal do carrinho (em centavos)
  const subtotal = input.items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  // 3. Buscar opções de frete (se CEP fornecido)
  const shippingOptions: DeliveryOption[] = []
  if (input.destination_zip_code) {
    const shippingItems = input.items.map((item) => ({
      quantity: item.quantity,
      weight: 0.3, // peso padrão em kg (pode ser melhorado no futuro)
      height: 4, // dimensões padrão em cm
      width: 12,
      length: 17
    }))

    const shippingInput: ShippingCalculationInput = {
      destinationZipCode: input.destination_zip_code,
      items: shippingItems
    }

    const calculateShippingService = new CalculateShippingService({
      shippingGateway
    })

    const shippingResult = await calculateShippingService.execute(shippingInput)

    // Aplicar regra de frete grátis se aplicável
    for (const quote of shippingResult.quotes) {
      let price = Math.round(parseFloat(quote.custom_price || quote.price || '0') * 100) // converter para centavos

      // Se subtotal >= free_shipping_min_total, aplicar frete grátis
      if (
        freeShippingMinTotal !== null &&
        subtotal >= freeShippingMinTotal * 100 // converter para centavos
      ) {
        price = 0
      }

      shippingOptions.push({
        type: 'shipping',
        id: String(quote.id),
        name: quote.name,
        price,
        description: quote.company?.name,
        delivery_time: formatDeliveryTime(quote)
      })
    }
  }

  // 4. Buscar pontos de retirada ativos
  const pickupPoints = await pickupPointRepository.listByStore(storeId, true)
  const pickupOptions: DeliveryOption[] = pickupPoints.map((point) => ({
    type: 'pickup_point',
    id: point.id,
    name: point.name,
    price: 0, // retirada sempre grátis
    description: 'Retirada na loja',
    address: {
      street: point.street,
      number: point.number,
      complement: point.complement,
      neighborhood: point.neighborhood,
      city: point.city,
      state: point.state,
      zip_code: point.zip_code
    }
  }))

  return {
    shippingOptions,
    pickupOptions
  }
}

function formatDeliveryTime(quote: {
  delivery_range?: { min: number; max: number }
  custom_delivery_range?: { min: number; max: number }
  delivery_time?: number
  custom_delivery_time?: number
}): string {
  // Tenta usar delivery_range primeiro
  if (quote.delivery_range?.min !== undefined && quote.delivery_range?.max !== undefined) {
    const min = quote.delivery_range.min
    const max = quote.delivery_range.max
    if (min === max) {
      return `${min} ${min === 1 ? 'dia útil' : 'dias úteis'}`
    }
    return `${min} a ${max} dias úteis`
  }

  // Fallback para custom_delivery_range
  if (
    quote.custom_delivery_range?.min !== undefined &&
    quote.custom_delivery_range?.max !== undefined
  ) {
    const min = quote.custom_delivery_range.min
    const max = quote.custom_delivery_range.max
    if (min === max) {
      return `${min} ${min === 1 ? 'dia útil' : 'dias úteis'}`
    }
    return `${min} a ${max} dias úteis`
  }

  // Fallback para delivery_time ou custom_delivery_time
  const deliveryTime = quote.custom_delivery_time || quote.delivery_time
  if (deliveryTime !== undefined) {
    return `${deliveryTime} ${deliveryTime === 1 ? 'dia útil' : 'dias úteis'}`
  }

  return 'Prazo a consultar'
}

