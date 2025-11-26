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
  created_at: Date
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  variant_id: string | null
  quantity: number
  price: string // numeric como string do Drizzle
}

export interface OrderWithItems extends Order {
  items: OrderItem[]
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

