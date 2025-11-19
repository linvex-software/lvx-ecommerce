import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  index
} from 'drizzle-orm/pg-core'
import { stores } from './core'

export const integrations = pgTable(
  'integrations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    store_id: uuid('store_id')
      .notNull()
      .references(() => stores.id, { onDelete: 'cascade' }),
    service: text('service').notNull(),
    config_json: jsonb('config_json')
      .$type<Record<string, unknown>>()
      .notNull(),
    created_at: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull()
  },
  (table) => ({
    storeServiceIdx: index('integrations_store_service_idx').on(
      table.store_id,
      table.service
    )
  })
)

