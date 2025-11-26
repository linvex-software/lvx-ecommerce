import {
  pgTable,
  uuid,
  text,
  timestamp,
  numeric,
  integer,
  index
} from 'drizzle-orm/pg-core'
import { stores } from './core'
import { customers } from './customers'
import { products } from './catalog'
import { productVariants } from './catalog'
import { users } from './core'

export const orders = pgTable(
  'orders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    store_id: uuid('store_id')
      .notNull()
      .references(() => stores.id, { onDelete: 'cascade' }),
    customer_id: uuid('customer_id').references(() => customers.id, {
      onDelete: 'set null'
    }),
    total: numeric('total', { precision: 12, scale: 2 }).notNull(),
    status: text('status').notNull(),
    payment_status: text('payment_status').notNull(),
    shipping_cost: numeric('shipping_cost', { precision: 12, scale: 2 })
      .notNull()
      .default('0'),
    shipping_label_url: text('shipping_label_url'),
    tracking_code: text('tracking_code'),
    created_at: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull()
  },
  (table) => ({
    storeCreatedIdx: index('orders_store_created_idx').on(
      table.store_id,
      table.created_at
    ),
    storeStatusIdx: index('orders_store_status_idx').on(
      table.store_id,
      table.status
    )
  })
)

export const orderItems = pgTable(
  'order_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    order_id: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    product_id: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'restrict' }),
    variant_id: uuid('variant_id').references(() => productVariants.id, {
      onDelete: 'set null'
    }),
    quantity: integer('quantity').notNull(),
    price: numeric('price', { precision: 12, scale: 2 }).notNull()
  },
  (table) => ({
    orderIdIdx: index('order_items_order_id_idx').on(table.order_id)
  })
)

export const physicalSales = pgTable(
  'physical_sales',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    store_id: uuid('store_id')
      .notNull()
      .references(() => stores.id, { onDelete: 'cascade' }),
    product_id: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'restrict' }),
    quantity: integer('quantity').notNull(),
    total: numeric('total', { precision: 12, scale: 2 }).notNull(),
    seller_user_id: uuid('seller_user_id').references(() => users.id, {
      onDelete: 'set null'
    }),
    created_at: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull()
  },
  (table) => ({
    storeCreatedIdx: index('physical_sales_store_created_idx').on(
      table.store_id,
      table.created_at
    )
  })
)

