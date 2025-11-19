import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  index
} from 'drizzle-orm/pg-core'
import { stores } from './core'
import { users } from './core'

export const systemLogs = pgTable(
  'system_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    store_id: uuid('store_id').references(() => stores.id, {
      onDelete: 'set null'
    }),
    user_id: uuid('user_id').references(() => users.id, {
      onDelete: 'set null'
    }),
    action: text('action').notNull(),
    metadata_json: jsonb('metadata_json').$type<Record<string, unknown>>(),
    created_at: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull()
  },
  (table) => ({
    storeCreatedIdx: index('system_logs_store_created_idx').on(
      table.store_id,
      table.created_at
    )
  })
)

