import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  jsonb,
  numeric,
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
    free_shipping_min_total: numeric('free_shipping_min_total', {
      precision: 12,
      scale: 2
    }),
    // Configurações gerais da loja
    cnpj_cpf: text('cnpj_cpf'),
    whatsapp: text('whatsapp'),
    email: text('email'),
    address: text('address'),
    social_media: jsonb('social_media').$type<{
      facebook?: string
      instagram?: string
      twitter?: string
      linkedin?: string
      youtube?: string
      tiktok?: string
    }>(),
    favicon_url: text('favicon_url'),
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
      .references(() => stores.id, { onDelete: 'cascade' }), // Opcional - null se usuário ainda não tem loja
    name: text('name').notNull(),
    email: text('email').notNull(),
    password_hash: text('password_hash').notNull(),
    role: text('role'), // Role do usuário na sua loja (opcional até criar a store no onboarding)
    created_at: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull()
  },
  (table) => ({
    emailUnique: uniqueIndex('users_email_unique').on(table.email)
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
