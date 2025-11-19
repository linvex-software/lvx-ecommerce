import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  numeric,
  integer,
  uniqueIndex,
  index
} from 'drizzle-orm/pg-core'
import { stores } from './core'

export const products = pgTable(
  'products',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    store_id: uuid('store_id')
      .notNull()
      .references(() => stores.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    price: numeric('price', { precision: 12, scale: 2 }).notNull(),
    sku: text('sku').notNull(),
    active: boolean('active').notNull().default(true),
    created_at: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull()
  },
  (table) => ({
    storeSkuUnique: uniqueIndex('products_store_sku_unique').on(
      table.store_id,
      table.sku
    )
  })
)

export const productVariants = pgTable(
  'product_variants',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    product_id: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    size: text('size'),
    color: text('color'),
    barcode: text('barcode'),
    stock: integer('stock').notNull().default(0),
    price_override: numeric('price_override', { precision: 12, scale: 2 }),
    active: boolean('active').notNull().default(true)
  },
  (table) => ({
    productIdIdx: index('product_variants_product_id_idx').on(table.product_id),
    productSizeColorUnique: uniqueIndex(
      'product_variants_product_size_color_unique'
    ).on(table.product_id, table.size, table.color)
  })
)

export const productImages = pgTable('product_images', {
  id: uuid('id').primaryKey().defaultRandom(),
  product_id: uuid('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  image_url: text('image_url').notNull(),
  position: integer('position').notNull().default(0)
})

export const categories = pgTable(
  'categories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    store_id: uuid('store_id')
      .notNull()
      .references(() => stores.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    created_at: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull()
  },
  (table) => ({
    storeSlugUnique: uniqueIndex('categories_store_slug_unique').on(
      table.store_id,
      table.slug
    )
  })
)

export const productCategory = pgTable(
  'product_category',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    product_id: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    category_id: uuid('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'cascade' })
  },
  (table) => ({
    productCategoryUnique: uniqueIndex(
      'product_category_product_category_unique'
    ).on(table.product_id, table.category_id)
  })
)

