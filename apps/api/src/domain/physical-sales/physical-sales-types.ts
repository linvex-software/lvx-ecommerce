export type PhysicalSaleStatus = 'completed' | 'pending' | 'cancelled'

export interface PhysicalSale {
  id: string
  store_id: string
  product_id: string
  quantity: number
  total: string // numeric como string do Drizzle (em centavos)
  seller_user_id: string | null
  coupon_id: string | null
  shipping_cost: string // em centavos
  commission_amount: string | null // em centavos
  cart_id: string | null
  status: PhysicalSaleStatus
  created_at: Date
}

export interface CreatePhysicalSaleInput {
  product_id: string
  quantity: number
  total: number // em centavos
  coupon_code?: string | null
  variant_id?: string | null
  cart_id?: string | null
  shipping_address?: {
    zip_code: string
    address?: string
    city?: string
    state?: string
  } | null
  commission_rate?: number | null // porcentagem
}

export interface PhysicalSaleWithRelations extends PhysicalSale {
  product: {
    id: string
    name: string
    slug: string
    base_price: string
    sku: string
  }
  seller: {
    id: string
    name: string
    email: string
  } | null
  discount?: number // desconto aplicado (em centavos)
  subtotal?: number // subtotal antes do desconto (em centavos)
  shipping_cost_amount?: number // em centavos
  commission?: {
    amount: number
    rate: number | null
    status: string
  } | null
}

export interface ListPhysicalSalesFilters {
  start_date?: Date
  end_date?: Date
  seller_id?: string
  product_id?: string
  page?: number
  limit?: number
}

export interface PhysicalSalesListResult {
  sales: PhysicalSaleWithRelations[]
  total: number
  page: number
  limit: number
}

export interface PhysicalSalesByProductReport {
  product_id: string
  product_name: string
  total_quantity: number
  total_amount: number // em centavos
}

// Carrinho Inteligente (Abandoned Carts)
export type PhysicalSalesCartStatus = 'active' | 'abandoned' | 'converted'

export interface PhysicalSalesCartItem {
  product_id: string
  variant_id?: string | null
  quantity: number
  price: number // em centavos
}

export interface PhysicalSalesCart {
  id: string
  store_id: string
  seller_user_id: string
  status: PhysicalSalesCartStatus
  items: PhysicalSalesCartItem[]
  total: string // em centavos
  coupon_code: string | null
  shipping_address: string | null
  last_activity_at: Date
  created_at: Date
  updated_at: Date
}

export interface CreatePhysicalSalesCartInput {
  items: PhysicalSalesCartItem[]
  coupon_code?: string | null
  shipping_address?: string | null
}

export interface UpdatePhysicalSalesCartInput {
  items?: PhysicalSalesCartItem[]
  coupon_code?: string | null
  shipping_address?: string | null
}

// Comissão
export type CommissionStatus = 'pending' | 'paid' | 'cancelled'

export interface PhysicalSaleCommission {
  id: string
  store_id: string
  physical_sale_id: string
  seller_user_id: string
  commission_amount: string // em centavos
  commission_rate: string | null // porcentagem
  status: CommissionStatus
  paid_at: Date | null
  created_at: Date
}

// Frete
export interface ShippingCalculationInput {
  zip_code: string
  weight?: number // em kg
  items?: Array<{
    product_id: string
    quantity: number
  }>
}

export interface ShippingCalculationResult {
  cost: number // em centavos
  estimated_days: number | null
  provider?: string
}

