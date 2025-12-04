import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  numeric,
  integer,
  jsonb,
  index
} from 'drizzle-orm/pg-core'
import { stores } from './core'
import { orders } from './orders'

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

export const shippingQuotes = pgTable(
  'shipping_quotes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    store_id: uuid('store_id')
      .notNull()
      .references(() => stores.id, { onDelete: 'cascade' }),
    order_id: uuid('order_id').references(() => orders.id, {
      onDelete: 'set null'
    }),
    quote_id: integer('quote_id').notNull(), // ID da quote da API (MelhorEnvio)
    name: text('name').notNull(), // Nome do serviço (ex: "PAC", "Sedex")
    provider: text('provider').notNull(), // 'melhor_envio', 'correios', etc
    origin_zip: text('origin_zip').notNull(),
    dest_zip: text('dest_zip').notNull(),
    price: numeric('price', { precision: 12, scale: 2 }).notNull(), // em centavos
    currency: text('currency').notNull().default('BRL'),
    delivery_time: integer('delivery_time'), // dias
    delivery_range_min: integer('delivery_range_min'),
    delivery_range_max: integer('delivery_range_max'),
    company_id: integer('company_id'), // ID da transportadora
    company_name: text('company_name'),
    quote_data: jsonb('quote_data').notNull().$type<{
      custom_price?: string
      discount?: string
      custom_delivery_time?: number
      custom_delivery_range?: { min: number; max: number }
      packages?: Array<{
        price?: string
        discount?: string
        format: string
        dimensions: { height: number; width: number; length: number }
        weight: string
        insurance_value: string
      }>
      additional_services?: {
        receipt: boolean
        own_hand: boolean
        collect: boolean
      }
      company?: {
        id: number
        name: string
        picture: string
      }
    }>(),
    created_at: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull()
  },
  (table) => ({
    storeOrderIdx: index('shipping_quotes_store_order_idx').on(
      table.store_id,
      table.order_id
    ),
    storeProviderIdx: index('shipping_quotes_store_provider_idx').on(
      table.store_id,
      table.provider
    ),
    quoteIdProviderIdx: index('shipping_quotes_quote_id_provider_idx').on(
      table.quote_id,
      table.provider
    )
  })
)

