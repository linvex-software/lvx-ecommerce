import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  index
} from 'drizzle-orm/pg-core'
import { stores } from './core'

export const webhookEvents = pgTable(
  'webhook_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    store_id: uuid('store_id')
      .notNull()
      .references(() => stores.id, { onDelete: 'cascade' }),
    provider: text('provider').notNull(),
    event_type: text('event_type'),
    payload: jsonb('payload').$type<Record<string, unknown>>().notNull(),
    signature_valid: boolean('signature_valid').notNull().default(false),
    status: text('status').notNull().default('received'),
    attempts: integer('attempts').notNull().default(0),
    last_attempt_at: timestamp('last_attempt_at', { withTimezone: true }),
    error_message: text('error_message'),
    created_at: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull()
  },
  (table) => ({
    storeIdIdx: index('webhook_events_store_id_idx').on(table.store_id),
    providerIdx: index('webhook_events_provider_idx').on(table.provider),
    statusIdx: index('webhook_events_status_idx').on(table.status)
  })
)

