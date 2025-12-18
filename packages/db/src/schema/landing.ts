import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  uniqueIndex,
  index
} from 'drizzle-orm/pg-core'
import { stores } from './core'

export const landingPages = pgTable(
  'landing_pages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    store_id: uuid('store_id')
      .notNull()
      .references(() => stores.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    slug: text('slug').notNull(),
    published: boolean('published').notNull().default(false),
    created_at: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull()
  },
  (table) => ({
    storeSlugUnique: uniqueIndex('landing_pages_store_slug_unique').on(
      table.store_id,
      table.slug
    )
  })
)

export const landingPageBlocks = pgTable(
  'landing_page_blocks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    landing_page_id: uuid('landing_page_id')
      .notNull()
      .references(() => landingPages.id, { onDelete: 'cascade' }),
    block_type: text('block_type').notNull(),
    block_config_json: jsonb('block_config_json')
      .$type<Record<string, unknown>>()
      .notNull(),
    order_index: integer('order_index').notNull().default(0)
  },
  (table) => ({
    landingPageOrderIdx: index('landing_page_blocks_landing_page_order_idx').on(
      table.landing_page_id,
      table.order_index
    )
  })
)

