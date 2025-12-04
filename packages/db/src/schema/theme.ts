import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  jsonb,
  uniqueIndex,
  index
} from 'drizzle-orm/pg-core'
import { stores } from './core'

export const storeThemeConfig = pgTable(
  'store_theme_config',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    store_id: uuid('store_id')
      .notNull()
      .references(() => stores.id, { onDelete: 'cascade' }),
    logo_url: text('logo_url'),
    banner_url: text('banner_url'),
    primary_color: text('primary_color'),
    secondary_color: text('secondary_color'),
    text_color: text('text_color'),
    icon_color: text('icon_color'),
    banner_config_json: jsonb('banner_config_json').$type<
      Record<string, unknown>
    >(),
    created_at: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
  },
  (table) => ({
    storeIdUnique: uniqueIndex('store_theme_config_store_id_unique').on(
      table.store_id
    )
  })
)

export const themeSections = pgTable(
  'theme_sections',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    store_id: uuid('store_id')
      .notNull()
      .references(() => stores.id, { onDelete: 'cascade' }),
    section_type: text('section_type').notNull(),
    config_json: jsonb('config_json')
      .$type<Record<string, unknown>>()
      .notNull(),
    order_index: integer('order_index').notNull().default(0),
    created_at: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull()
  },
  (table) => ({
    storeOrderIdx: index('theme_sections_store_order_idx').on(
      table.store_id,
      table.order_index
    )
  })
)

