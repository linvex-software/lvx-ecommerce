import { db, schema } from '@white-label/db'

export interface RegisterCouponUsageInput {
  coupon_id: string
  store_id: string
  order_id?: string | null
  customer_id?: string | null
  discount_value: number // em centavos
}

export class CouponUsageRepository {
  async registerUsage(data: RegisterCouponUsageInput): Promise<void> {
    await db.insert(schema.couponUsage).values({
      coupon_id: data.coupon_id,
      store_id: data.store_id,
      order_id: data.order_id ?? null,
      customer_id: data.customer_id ?? null,
      discount_value: data.discount_value.toString()
    })
  }
}

