import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  index
} from 'drizzle-orm/pg-core'
import { stores } from './core'
import { products } from './catalog'
import { productVariants } from './catalog'

export const stockMovements = pgTable(
  'stock_movements',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    store_id: uuid('store_id')
      .notNull()
      .references(() => stores.id, { onDelete: 'cascade' }),
    product_id: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    variant_id: uuid('variant_id').references(() => productVariants.id, {
      onDelete: 'set null'
    }),
    type: text('type').notNull(),
    origin: text('origin'),
    quantity: integer('quantity').notNull(),
    created_at: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull()
  },
  (table) => ({
    storeProductIdx: index('stock_movements_store_product_idx').on(
      table.store_id,
      table.product_id
    ),
    storeCreatedIdx: index('stock_movements_store_created_idx').on(
      table.store_id,
      table.created_at
    )
  })
)

