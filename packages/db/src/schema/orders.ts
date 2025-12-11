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
    delivery_type: text('delivery_type'), // 'shipping' | 'pickup_point'
    delivery_option_id: text('delivery_option_id'), // ID da opção escolhida (quote.id ou pickup_point.id)
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
    coupon_id: uuid('coupon_id'),
    shipping_cost: numeric('shipping_cost', { precision: 12, scale: 2 })
      .notNull()
      .default('0'),
    commission_amount: numeric('commission_amount', { precision: 12, scale: 2 }),
    cart_id: uuid('cart_id'),
    status: text('status').notNull().default('completed'), // completed, pending, cancelled
    created_at: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull()
  },
  (table) => ({
    storeCreatedIdx: index('physical_sales_store_created_idx').on(
      table.store_id,
      table.created_at
    ),
    storeStatusIdx: index('physical_sales_store_status_idx').on(
      table.store_id,
      table.status
    ),
    cartIdIdx: index('physical_sales_cart_id_idx').on(table.cart_id)
  })
)

export const physicalSalesCarts = pgTable(
  'physical_sales_carts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    store_id: uuid('store_id')
      .notNull()
      .references(() => stores.id, { onDelete: 'cascade' }),
    seller_user_id: uuid('seller_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    status: text('status').notNull().default('active'), // active, abandoned, converted
    items_json: text('items_json').notNull().$type<Array<{
      product_id: string
      variant_id?: string | null
      quantity: number
      price: number
    }>>(),
    total: numeric('total', { precision: 12, scale: 2 }).notNull().default('0'),
    coupon_code: text('coupon_code'),
    shipping_address: text('shipping_address'),
    last_activity_at: timestamp('last_activity_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    created_at: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
  },
  (table) => ({
    storeSellerIdx: index('physical_sales_carts_store_seller_idx').on(
      table.store_id,
      table.seller_user_id
    ),
    storeStatusIdx: index('physical_sales_carts_store_status_idx').on(
      table.store_id,
      table.status
    )
  })
)

export const physicalSalesCommissions = pgTable(
  'physical_sales_commissions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    store_id: uuid('store_id')
      .notNull()
      .references(() => stores.id, { onDelete: 'cascade' }),
    physical_sale_id: uuid('physical_sale_id')
      .notNull()
      .references(() => physicalSales.id, { onDelete: 'cascade' }),
    seller_user_id: uuid('seller_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    commission_amount: numeric('commission_amount', { precision: 12, scale: 2 })
      .notNull(),
    commission_rate: numeric('commission_rate', { precision: 5, scale: 2 }), // porcentagem
    status: text('status').notNull().default('pending'), // pending, paid, cancelled
    paid_at: timestamp('paid_at', { withTimezone: true }),
    created_at: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull()
  },
  (table) => ({
    saleIdIdx: index('physical_sales_commissions_sale_id_idx').on(
      table.physical_sale_id
    ),
    storeSellerIdx: index('physical_sales_commissions_store_seller_idx').on(
      table.store_id,
      table.seller_user_id
    )
  })
)

export const orderStatusHistory = pgTable(
  'order_status_history',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    order_id: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    from_status: text('from_status'),
    to_status: text('to_status').notNull(),
    from_payment_status: text('from_payment_status'),
    to_payment_status: text('to_payment_status'),
    changed_by_user_id: uuid('changed_by_user_id').references(() => users.id, {
      onDelete: 'set null'
    }),
    notes: text('notes'),
    created_at: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull()
  },
  (table) => ({
    orderIdIdx: index('order_status_history_order_id_idx').on(table.order_id),
    orderCreatedIdx: index('order_status_history_order_created_idx').on(
      table.order_id,
      table.created_at
    )
  })
)


