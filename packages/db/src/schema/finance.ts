import {
  pgTable,
  uuid,
  text,
  timestamp,
  numeric,
  index
} from 'drizzle-orm/pg-core'
import { stores } from './core'

export const storeFees = pgTable(
  'store_fees',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    store_id: uuid('store_id')
      .notNull()
      .references(() => stores.id, { onDelete: 'cascade' }),
    fee_type: text('fee_type').notNull(),
    value: numeric('value', { precision: 12, scale: 4 }).notNull(),
    created_at: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull()
  },
  (table) => ({
    storeFeeTypeIdx: index('store_fees_store_fee_type_idx').on(
      table.store_id,
      table.fee_type
    )
  })
)

export const payouts = pgTable(
  'payouts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    store_id: uuid('store_id')
      .notNull()
      .references(() => stores.id, { onDelete: 'cascade' }),
    amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
    status: text('status').notNull(),
    created_at: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull()
  },
  (table) => ({
    storeCreatedIdx: index('payouts_store_created_idx').on(
      table.store_id,
      table.created_at
    )
  })
)

