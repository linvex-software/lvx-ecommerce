import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  jsonb,
  uniqueIndex,
  index
} from 'drizzle-orm/pg-core'

export const stores = pgTable(
  'stores',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    domain: text('domain').notNull(),
    active: boolean('active').notNull().default(true),
    created_at: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull()
  },
  (table) => ({
    domainUnique: uniqueIndex('stores_domain_unique').on(table.domain)
  })
)

export const userRoles = pgTable(
  'user_roles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    store_id: uuid('store_id')
      .notNull()
      .references(() => stores.id, { onDelete: 'cascade' }),
    role_name: text('role_name').notNull(),
    permissions: jsonb('permissions')
      .$type<Record<string, unknown>>()
      .notNull(),
    created_at: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull()
  },
  (table) => ({
    storeRoleNameUnique: uniqueIndex('user_roles_store_role_name_unique').on(
      table.store_id,
      table.role_name
    )
  })
)

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    store_id: uuid('store_id')
      .notNull()
      .references(() => stores.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    email: text('email').notNull(),
    password_hash: text('password_hash').notNull(),
    role: text('role').notNull(),
    created_at: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull()
  },
  (table) => ({
    storeEmailUnique: uniqueIndex('users_store_email_unique').on(
      table.store_id,
      table.email
    )
  })
)

export const storeSettings = pgTable(
  'store_settings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    store_id: uuid('store_id')
      .notNull()
      .references(() => stores.id, { onDelete: 'cascade' }),
    config_json: jsonb('config_json')
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
    storeIdUnique: uniqueIndex('store_settings_store_id_unique').on(
      table.store_id
    )
  })
)
