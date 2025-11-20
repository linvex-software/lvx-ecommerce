import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  numeric,
  integer,
  uniqueIndex,
  index
} from 'drizzle-orm/pg-core'
import { stores } from './core'

export const coupons = pgTable(
  'coupons',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    store_id: uuid('store_id')
      .notNull()
      .references(() => stores.id, { onDelete: 'cascade' }),
    code: text('code').notNull(),
    type: text('type').notNull(),
    value: numeric('value', { precision: 12, scale: 2 }).notNull(),
    min_value: numeric('min_value', { precision: 12, scale: 2 }),
    max_uses: integer('max_uses'),
    used_count: integer('used_count').notNull().default(0),
    expires_at: timestamp('expires_at', { withTimezone: true }),
    active: boolean('active').notNull().default(true),
    created_at: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull()
  },
  (table) => ({
    storeCodeUnique: uniqueIndex('coupons_store_code_unique').on(
      table.store_id,
      table.code
    ),
    storeIdIdx: index('coupons_store_id_idx').on(table.store_id),
    activeIdx: index('coupons_active_idx').on(table.active)
  })
)

