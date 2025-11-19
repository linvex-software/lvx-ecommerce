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

export const webhooks = pgTable('webhooks', {
  id: uuid('id').primaryKey().defaultRandom(),
  store_id: uuid('store_id')
    .notNull()
    .references(() => stores.id, { onDelete: 'cascade' }),
  target_url: text('target_url').notNull(),
  secret: text('secret'),
  active: boolean('active').notNull().default(true),
  event_types: jsonb('event_types')
    .$type<Record<string, unknown>>()
    .notNull(),
  created_at: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull()
})

export const webhookLogs = pgTable(
  'webhook_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    webhook_id: uuid('webhook_id')
      .notNull()
      .references(() => webhooks.id, { onDelete: 'cascade' }),
    payload: jsonb('payload').$type<Record<string, unknown>>().notNull(),
    status_code: integer('status_code'),
    created_at: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull()
  },
  (table) => ({
    webhookCreatedIdx: index('webhook_logs_webhook_created_idx').on(
      table.webhook_id,
      table.created_at
    )
  })
)

