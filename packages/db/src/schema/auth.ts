import {
  pgTable,
  uuid,
  text,
  timestamp,
  index
} from 'drizzle-orm/pg-core'
import { stores } from './core'
import { users } from './core'
import { customers } from './customers'

export const authSessions = pgTable(
  'auth_sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    user_id: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
    customer_id: uuid('customer_id').references(() => customers.id, {
      onDelete: 'cascade'
    }),
    store_id: uuid('store_id')
      .notNull()
      .references(() => stores.id, { onDelete: 'cascade' }),
    refresh_token: text('refresh_token').notNull(),
    user_agent: text('user_agent'),
    ip_address: text('ip_address'),
    expires_at: timestamp('expires_at', { withTimezone: true }).notNull(),
    created_at: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    revoked_at: timestamp('revoked_at', { withTimezone: true })
  },
  (table) => ({
    userIdIdx: index('auth_sessions_user_id_idx').on(table.user_id),
    customerIdIdx: index('auth_sessions_customer_id_idx').on(table.customer_id),
    storeIdIdx: index('auth_sessions_store_id_idx').on(table.store_id),
    refreshTokenIdx: index('auth_sessions_refresh_token_idx').on(
      table.refresh_token
    )
  })
)

