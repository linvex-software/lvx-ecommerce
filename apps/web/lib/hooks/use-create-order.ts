import { useState } from 'react'
import { fetchAPI } from '../api'

interface CreateOrderInput {
  customer_id?: string | null
  items: Array<{
    product_id: string
    variant_id?: string | null
    quantity: number
    price: number // em centavos
  }>
  shipping_cost: number // em centavos
  coupon_code?: string | null
  shipping_address?: {
    zip_code: string
    street?: string
    number?: string
    complement?: string
    neighborhood?: string
    city?: string
    state?: string
    country?: string
  } | null
}

interface CreateOrderResponse {
  order: {
    id: string
    store_id: string
    customer_id: string | null
    total: string
    status: string
    payment_status: string
    shipping_cost: string
    shipping_label_url: string | null
    tracking_code: string | null
    created_at: string
    items: Array<{
      id: string
      order_id: string
      product_id: string
      variant_id: string | null
      quantity: number
      price: string
    }>
  }
}

export function useCreateOrder() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createOrder = async (input: CreateOrderInput): Promise<CreateOrderResponse['order']> => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetchAPI('/orders', {
        method: 'POST',
        body: JSON.stringify(input)
      }) as CreateOrderResponse

      return response.order
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Erro ao criar pedido. Tente novamente.'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  return {
    createOrder,
    isLoading,
    error
  }
}

