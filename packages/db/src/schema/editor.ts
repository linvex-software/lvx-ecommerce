import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  uniqueIndex,
  index
} from 'drizzle-orm/pg-core'
import { stores } from './core'

export const storeLayouts = pgTable(
  'store_layouts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    store_id: uuid('store_id')
      .notNull()
      .references(() => stores.id, { onDelete: 'cascade' }),
    layout_json: jsonb('layout_json')
      .$type<Record<string, unknown>>()
      .notNull(),
    created_at: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
  },
  (table) => ({
    storeIdUnique: uniqueIndex('store_layouts_store_id_unique').on(
      table.store_id
    ),
    storeIdIdx: index('store_layouts_store_id_idx').on(table.store_id)
  })
)




