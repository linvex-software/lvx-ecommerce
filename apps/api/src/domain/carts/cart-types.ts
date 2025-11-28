export type CartStatus = 'active' | 'abandoned' | 'converted'

export interface CartItem {
  product_id: string
  variant_id?: string | null
  quantity: number
  price: number
}

export interface Cart {
  id: string
  store_id: string
  customer_id: string | null
  session_id: string | null
  status: CartStatus
  items: CartItem[]
  total: string // numeric como string do Drizzle
  coupon_code: string | null
  last_activity_at: Date
  created_at: Date
  updated_at: Date
}

export interface CreateCartInput {
  items: CartItem[]
  coupon_code?: string | null
  customer_id?: string | null
  session_id?: string | null
}

export interface UpdateCartInput {
  items?: CartItem[]
  coupon_code?: string | null
}

