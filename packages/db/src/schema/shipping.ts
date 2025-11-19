import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  numeric,
  index
} from 'drizzle-orm/pg-core'
import { stores } from './core'

export const shippingProviders = pgTable(
  'shipping_providers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    store_id: uuid('store_id')
      .notNull()
      .references(() => stores.id, { onDelete: 'cascade' }),
    provider_name: text('provider_name').notNull(),
    api_key: text('api_key'),
    active: boolean('active').notNull().default(true),
    created_at: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull()
  },
  (table) => ({
    storeProviderIdx: index('shipping_providers_store_provider_idx').on(
      table.store_id,
      table.provider_name
    )
  })
)

export const shippingCache = pgTable(
  'shipping_cache',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    store_id: uuid('store_id')
      .notNull()
      .references(() => stores.id, { onDelete: 'cascade' }),
    origin_zip: text('origin_zip').notNull(),
    dest_zip: text('dest_zip').notNull(),
    weight: numeric('weight', { precision: 10, scale: 3 }).notNull(),
    price: numeric('price', { precision: 12, scale: 2 }).notNull(),
    expires_at: timestamp('expires_at', { withTimezone: true }).notNull(),
    created_at: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull()
  },
  (table) => ({
    storeShippingIdx: index('shipping_cache_store_shipping_idx').on(
      table.store_id,
      table.origin_zip,
      table.dest_zip,
      table.weight
    )
  })
)

