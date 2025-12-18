export type StockMovementType = 'IN' | 'OUT' | 'ADJUST'
export type StockMovementOrigin = 'manual' | 'order' | 'physical_sale' | 'adjustment' | 'return' | 'order_cancellation'

export interface StockMovement {
  id: string
  store_id: string
  product_id: string
  variant_id: string | null
  type: StockMovementType
  origin: StockMovementOrigin | null
  quantity: number
  reason: string | null
  final_quantity: number | null // Para ADJUST: saldo final desejado
  created_by: string | null
  created_at: Date
}

export interface ProductStock {
  product_id: string
  variant_id: string | null
  current_stock: number
  last_movement_at: Date | null
}

export interface CreateStockMovementInput {
  store_id: string
  product_id: string
  variant_id?: string | null
  type: StockMovementType
  origin?: StockMovementOrigin
  quantity: number
  reason?: string | null
  final_quantity?: number | null // Para ADJUST: saldo final desejado
  created_by?: string | null
}

