import {
  pgTable,
  uuid,
  timestamp,
  numeric,
  index
} from 'drizzle-orm/pg-core'
import { stores } from './core'
import { coupons } from './coupons'

export const couponUsage = pgTable(
  'coupon_usage',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    coupon_id: uuid('coupon_id')
      .notNull()
      .references(() => coupons.id, { onDelete: 'cascade' }),
    store_id: uuid('store_id')
      .notNull()
      .references(() => stores.id, { onDelete: 'cascade' }),
    order_id: uuid('order_id'),
    customer_id: uuid('customer_id'),
    discount_value: numeric('discount_value', { precision: 12, scale: 2 }).notNull(),
    used_at: timestamp('used_at', { withTimezone: true })
      .defaultNow()
      .notNull()
  },
  (table) => ({
    storeIdIdx: index('coupon_usage_store_id_idx').on(table.store_id),
    couponIdIdx: index('coupon_usage_coupon_id_idx').on(table.coupon_id)
  })
)

