import {
  pgTable,
  uuid,
  text,
  timestamp,
  index
} from 'drizzle-orm/pg-core'
import { stores } from './core'

export const melhorEnvioTokens = pgTable(
  'melhor_envio_tokens',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    store_id: uuid('store_id')
      .notNull()
      .references(() => stores.id, { onDelete: 'cascade' }),
    access_token: text('access_token').notNull(),
    refresh_token: text('refresh_token').notNull(),
    expires_at: timestamp('expires_at', { withTimezone: true }).notNull(),
    created_at: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
  },
  (table) => ({
    storeIdUnique: index('melhor_envio_tokens_store_id_idx').on(table.store_id)
  })
)
