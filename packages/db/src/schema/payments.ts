import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  numeric,
  jsonb,
  index
} from 'drizzle-orm/pg-core'
import { stores } from './core'
import { orders } from './orders'

export const paymentMethods = pgTable(
  'payment_methods',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    store_id: uuid('store_id')
      .notNull()
      .references(() => stores.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    provider: text('provider').notNull(),
    config_json: jsonb('config_json').$type<Record<string, unknown>>(),
    active: boolean('active').notNull().default(true),
    created_at: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull()
  },
  (table) => ({
    storeProviderIdx: index('payment_methods_store_provider_idx').on(
      table.store_id,
      table.provider
    )
  })
)

export const transactions = pgTable(
  'transactions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    order_id: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    store_id: uuid('store_id')
      .notNull()
      .references(() => stores.id, { onDelete: 'cascade' }),
    payment_method_id: uuid('payment_method_id')
      .notNull()
      .references(() => paymentMethods.id, { onDelete: 'restrict' }),
    amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
    status: text('status').notNull(),
    provider_transaction_id: text('provider_transaction_id'),
    created_at: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull()
  },
  (table) => ({
    storeCreatedIdx: index('transactions_store_created_idx').on(
      table.store_id,
      table.created_at
    ),
    orderIdIdx: index('transactions_order_id_idx').on(table.order_id)
  })
)

