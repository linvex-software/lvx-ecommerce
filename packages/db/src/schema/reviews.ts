import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  boolean,
  index,
  uniqueIndex
} from 'drizzle-orm/pg-core'
import { stores } from './core'
import { products } from './catalog'
import { orderItems } from './orders'
import { customers } from './customers'

export const productReviews = pgTable(
  'product_reviews',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    store_id: uuid('store_id')
      .notNull()
      .references(() => stores.id, { onDelete: 'cascade' }),
    product_id: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    order_item_id: uuid('order_item_id')
      .notNull()
      .references(() => orderItems.id, { onDelete: 'cascade' }),
    customer_id: uuid('customer_id')
      .references(() => customers.id, { onDelete: 'set null' }),
    rating: integer('rating').notNull(), // 1-5
    is_hidden: boolean('is_hidden').notNull().default(false),
    created_at: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
  },
  (table) => ({
    orderItemUnique: uniqueIndex('product_reviews_order_item_unique').on(
      table.order_item_id
    ),
    productIdIdx: index('product_reviews_product_id_idx').on(table.product_id),
    storeIdIdx: index('product_reviews_store_id_idx').on(table.store_id),
    customerIdIdx: index('product_reviews_customer_id_idx').on(table.customer_id)
  })
)

export const reviewTags = pgTable(
  'review_tags',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    store_id: uuid('store_id')
      .notNull()
      .references(() => stores.id, { onDelete: 'cascade' }),
    review_id: uuid('review_id')
      .notNull()
      .references(() => productReviews.id, { onDelete: 'cascade' }),
    tag: text('tag').notNull(), // Tag name (ex: "Amei", "Produto excelente")
    rating: integer('rating').notNull() // Rating associado (1-5)
  },
  (table) => ({
    reviewIdIdx: index('review_tags_review_id_idx').on(table.review_id),
    storeIdIdx: index('review_tags_store_id_idx').on(table.store_id)
  })
)

