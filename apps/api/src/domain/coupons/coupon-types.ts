export type CouponType = 'percent' | 'fixed'

export interface Coupon {
  id: string
  store_id: string
  code: string
  type: CouponType
  value: string // numeric como string do Drizzle
  min_value: string | null
  max_uses: number | null
  used_count: number
  expires_at: Date | null
  active: boolean
  created_at: Date
}

export interface CreateCouponInput {
  store_id: string
  code: string
  type: CouponType
  value: number // em centavos para fixed, porcentagem para percent
  min_value?: number | null
  max_uses?: number | null
  expires_at?: Date | null
}

export interface UpdateCouponInput {
  code?: string
  type?: CouponType
  value?: number
  min_value?: number | null
  max_uses?: number | null
  expires_at?: Date | null
  active?: boolean
}

export interface ValidateCouponInput {
  storeId: string
  code: string
  orderTotal: number // em centavos
}

export interface ValidateCouponResult {
  valid: boolean
  discountType?: CouponType
  discountValue?: number // valor do desconto (centavos ou porcentagem)
  finalPrice?: number // total com desconto aplicado (centavos)
  message: string
}

