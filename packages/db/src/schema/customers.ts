import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  index,
  uniqueIndex
} from 'drizzle-orm/pg-core'
import { stores } from './core'
import { products } from './catalog'

export const customers = pgTable(
  'customers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    store_id: uuid('store_id')
      .notNull()
      .references(() => stores.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    email: text('email'),
    cpf: text('cpf'), // CPF opcional para criação rápida no PDV
    phone: text('phone'),
    password_hash: text('password_hash'),
    created_at: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull()
  },
  (table) => ({
    storeEmailIdx: index('customers_store_email_idx').on(
      table.store_id,
      table.email
    ),
    storeCpfIdx: index('customers_store_cpf_idx').on(table.store_id, table.cpf),
    storeCpfUnique: uniqueIndex('customers_store_cpf_unique').on(
      table.store_id,
      table.cpf
    ),
    // Unique index parcial para email (apenas onde email não é NULL)
    // Isso permite múltiplos NULLs mas garante unicidade quando email existe
    storeEmailUnique: uniqueIndex('customers_store_email_unique').on(
      table.store_id,
      table.email
    )
  })
)

export const customerAddresses = pgTable(
  'customer_addresses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    customer_id: uuid('customer_id')
      .notNull()
      .references(() => customers.id, { onDelete: 'cascade' }),
    street: text('street').notNull(),
    city: text('city').notNull(),
    state: text('state').notNull(),
    zip: text('zip').notNull(),
    is_default: boolean('is_default').notNull().default(false)
  },
  (table) => ({
    customerDefaultIdx: index('customer_addresses_customer_default_idx').on(
      table.customer_id,
      table.is_default
    )
  })
)

export const customerFavorites = pgTable(
  'customer_favorites',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    store_id: uuid('store_id')
      .notNull()
      .references(() => stores.id, { onDelete: 'cascade' }),
    customer_id: uuid('customer_id')
      .notNull()
      .references(() => customers.id, { onDelete: 'cascade' }),
    product_id: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    created_at: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull()
  },
  (table) => ({
    storeCustomerProductUnique: uniqueIndex('customer_favorites_store_customer_product_unique').on(
      table.store_id,
      table.customer_id,
      table.product_id
    ),
    customerIdx: index('customer_favorites_customer_idx').on(table.customer_id),
    productIdx: index('customer_favorites_product_idx').on(table.product_id),
    storeIdx: index('customer_favorites_store_idx').on(table.store_id)
  })
)

