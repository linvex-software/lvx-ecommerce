export interface ShippingQuote {
  id: number
  name: string
  price: string
  custom_price: string
  discount: string
  currency: string
  delivery_time: number
  delivery_range: {
    min: number
    max: number
  }
  custom_delivery_time: number
  custom_delivery_range: {
    min: number
    max: number
  }
  packages: Array<{
    price?: string
    discount?: string
    format: string
    dimensions: {
      height: number
      width: number
      length: number
    }
    weight: string
    insurance_value: string
  }>
  additional_services: {
    receipt: boolean
    own_hand: boolean
    collect: boolean
  }
  company: {
    id: number
    name: string
    picture: string
  }
}

export interface ShippingCalculationInput {
  destinationZipCode: string
  items: Array<{
    quantity: number
    weight: number // em kg
    height: number // em cm
    width: number // em cm
    length: number // em cm
  }>
}

export interface ShippingCalculationResult {
  quotes: ShippingQuote[]
}

