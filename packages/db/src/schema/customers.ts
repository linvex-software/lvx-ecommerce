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

export const customers = pgTable(
  'customers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    store_id: uuid('store_id')
      .notNull()
      .references(() => stores.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    email: text('email'),
    cpf: text('cpf').notNull(), // CPF obrigatório para login
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

