import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  numeric,
  integer,
  uniqueIndex,
  index,
  jsonb
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
    slug: text('slug').notNull(),
    description: text('description'),
    base_price: numeric('base_price', { precision: 12, scale: 2 }).notNull(),
    sku: text('sku').notNull(),
    status: text('status').notNull().default('draft'), // draft, active, inactive
    virtual_model_url: text('virtual_model_url'),
    virtual_provider: text('virtual_provider'),
    virtual_config_json: jsonb('virtual_config_json').$type<Record<string, unknown>>(),
    created_at: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
  },
  (table) => ({
    storeSkuUnique: uniqueIndex('products_store_sku_unique').on(
      table.store_id,
      table.sku
    ),
    storeSlugUnique: uniqueIndex('products_store_slug_unique').on(
      table.store_id,
      table.slug
    ),
    storeIdIdx: index('products_store_id_idx').on(table.store_id),
    storeStatusIdx: index('products_store_status_idx').on(table.store_id, table.status)
  })
)

export const productVariants = pgTable(
  'product_variants',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    store_id: uuid('store_id')
      .notNull()
      .references(() => stores.id, { onDelete: 'cascade' }),
    product_id: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    sku: text('sku'),
    size: text('size'),
    color: text('color'),
    barcode: text('barcode'),
    price_override: numeric('price_override', { precision: 12, scale: 2 }),
    active: boolean('active').notNull().default(true)
  },
  (table) => ({
    productIdIdx: index('product_variants_product_id_idx').on(table.product_id),
    storeSkuUnique: uniqueIndex('product_variants_store_sku_unique').on(
      table.store_id,
      table.sku
    ),
    productSizeColorUnique: uniqueIndex(
      'product_variants_product_size_color_unique'
    ).on(table.product_id, table.size, table.color)
  })
)

export const productImages = pgTable(
  'product_images',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    store_id: uuid('store_id')
      .notNull()
      .references(() => stores.id, { onDelete: 'cascade' }),
    product_id: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    image_url: text('image_url').notNull(),
    position: integer('position').notNull().default(0),
    is_main: boolean('is_main').notNull().default(false)
  },
  (table) => ({
    productIdIdx: index('product_images_product_id_idx').on(table.product_id)
  })
)

export const categories = pgTable(
  'categories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    store_id: uuid('store_id')
      .notNull()
      .references(() => stores.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    icon: text('icon'),
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

export const productSeo = pgTable(
  'product_seo',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    store_id: uuid('store_id')
      .notNull()
      .references(() => stores.id, { onDelete: 'cascade' }),
    product_id: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    meta_title: text('meta_title'),
    meta_description: text('meta_description'),
    meta_keywords: text('meta_keywords'),
    open_graph_image: text('open_graph_image'),
    created_at: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
  },
  (table) => ({
    productIdUnique: uniqueIndex('product_seo_product_id_unique').on(
      table.product_id
    ),
    storeIdIdx: index('product_seo_store_id_idx').on(table.store_id)
  })
)

export const productSizeChart = pgTable(
  'product_size_chart',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    store_id: uuid('store_id')
      .notNull()
      .references(() => stores.id, { onDelete: 'cascade' }),
    product_id: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    chart_json: jsonb('chart_json')
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
    productIdUnique: uniqueIndex('product_size_chart_product_id_unique').on(
      table.product_id
    ),
    storeIdIdx: index('product_size_chart_store_id_idx').on(table.store_id)
  })
)

