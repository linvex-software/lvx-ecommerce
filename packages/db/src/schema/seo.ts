import {
  pgTable,
  uuid,
  text,
  timestamp,
  index
} from 'drizzle-orm/pg-core'
import { stores } from './core'

export const seoMeta = pgTable(
  'seo_meta',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    store_id: uuid('store_id')
      .notNull()
      .references(() => stores.id, { onDelete: 'cascade' }),
    page: text('page').notNull(),
    title: text('title'),
    description: text('description'),
    keywords: text('keywords'),
    created_at: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
  },
  (table) => ({
    storePageIdx: index('seo_meta_store_page_idx').on(
      table.store_id,
      table.page
    )
  })
)

