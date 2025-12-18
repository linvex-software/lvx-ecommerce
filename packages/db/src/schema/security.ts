import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  jsonb,
  uniqueIndex
} from 'drizzle-orm/pg-core'
import { stores } from './core'

export const apiKeys = pgTable(
  'api_keys',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    store_id: uuid('store_id')
      .notNull()
      .references(() => stores.id, { onDelete: 'cascade' }),
    key: text('key').notNull(),
    permissions_json: jsonb('permissions_json').$type<Record<string, unknown>>(),
    active: boolean('active').notNull().default(true),
    created_at: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull()
  },
  (table) => ({
    storeKeyUnique: uniqueIndex('api_keys_store_key_unique').on(
      table.store_id,
      table.key
    )
  })
)

