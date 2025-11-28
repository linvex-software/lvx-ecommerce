import {
  pgTable,
  uuid,
  text,
  timestamp,
  numeric,
  index
} from 'drizzle-orm/pg-core'
import { stores } from './core'
import { customers } from './customers'

export const carts = pgTable(
  'carts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    store_id: uuid('store_id')
      .notNull()
      .references(() => stores.id, { onDelete: 'cascade' }),
    customer_id: uuid('customer_id').references(() => customers.id, {
      onDelete: 'set null'
    }),
    session_id: text('session_id'), // Para guest checkout
    status: text('status').notNull().default('active'), // 'active' | 'abandoned' | 'converted'
    items_json: text('items_json').notNull().$type<Array<{
      product_id: string
      variant_id?: string | null
      quantity: number
      price: number
    }>>(),
    total: numeric('total', { precision: 12, scale: 2 }).notNull().default('0'),
    coupon_code: text('coupon_code'),
    last_activity_at: timestamp('last_activity_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    created_at: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
  },
  (table) => ({
    storeCustomerIdx: index('carts_store_customer_idx').on(
      table.store_id,
      table.customer_id
    ),
    storeSessionIdx: index('carts_store_session_idx').on(
      table.store_id,
      table.session_id
    ),
    storeStatusIdx: index('carts_store_status_idx').on(
      table.store_id,
      table.status
    )
  })
)

