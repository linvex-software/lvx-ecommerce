import {
  pgTable,
  uuid,
  text,
  timestamp,
  index
} from 'drizzle-orm/pg-core'
import { stores } from './core'
import { customers } from './customers'
import { products } from './catalog'

export const virtualTryonSessions = pgTable(
  'virtual_tryon_sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    store_id: uuid('store_id')
      .notNull()
      .references(() => stores.id, { onDelete: 'cascade' }),
    customer_id: uuid('customer_id').references(() => customers.id, {
      onDelete: 'set null'
    }),
    product_id: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'restrict' }),
    image_input_url: text('image_input_url').notNull(),
    result_url: text('result_url'),
    created_at: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull()
  },
  (table) => ({
    storeCreatedIdx: index('virtual_tryon_sessions_store_created_idx').on(
      table.store_id,
      table.created_at
    )
  })
)

