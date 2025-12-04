export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
export type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'failed'

export interface Order {
  id: string
  store_id: string
  customer_id: string | null
  total: string // numeric como string do Drizzle
  status: OrderStatus
  payment_status: PaymentStatus
  shipping_cost: string // numeric como string do Drizzle
  shipping_label_url: string | null
  tracking_code: string | null
  delivery_type: 'shipping' | 'pickup_point' | null
  delivery_option_id: string | null
  created_at: Date
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  variant_id: string | null
  quantity: number
  price: string // numeric como string do Drizzle
  product_name?: string | null
}

export interface ShippingAddress {
  zip_code: string
  street?: string | null
  number?: string | null
  complement?: string | null
  neighborhood?: string | null
  city?: string | null
  state?: string | null
  country?: string | null
}

export interface OrderWithItems extends Order {
  items: OrderItem[]
  shipping_address?: ShippingAddress | null
}

export interface ListOrdersFilters {
  status?: OrderStatus
  payment_status?: PaymentStatus
  customer_id?: string
}

export interface UpdateOrderInput {
  status?: OrderStatus
  payment_status?: PaymentStatus
  shipping_label_url?: string | null
  tracking_code?: string | null
}

export interface CreateOrderInput {
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

