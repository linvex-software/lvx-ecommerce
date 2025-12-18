import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  index
} from 'drizzle-orm/pg-core'
import { stores } from './core'

export const analyticsEvents = pgTable(
  'analytics_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    store_id: uuid('store_id')
      .notNull()
      .references(() => stores.id, { onDelete: 'cascade' }),
    session_id: text('session_id').notNull(),
    event_type: text('event_type').notNull(),
    metadata_json: jsonb('metadata_json').$type<Record<string, unknown>>(),
    created_at: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull()
  },
  (table) => ({
    storeSessionIdx: index('analytics_events_store_session_idx').on(
      table.store_id,
      table.session_id
    ),
    storeEventTypeIdx: index('analytics_events_store_event_type_idx').on(
      table.store_id,
      table.event_type
    )
  })
)

