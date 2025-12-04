import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  index
} from 'drizzle-orm/pg-core'
import { stores } from './core'

export const pickupPoints = pgTable(
  'pickup_points',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    store_id: uuid('store_id')
      .notNull()
      .references(() => stores.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    street: text('street').notNull(),
    number: text('number').notNull(),
    complement: text('complement'),
    neighborhood: text('neighborhood').notNull(),
    city: text('city').notNull(),
    state: text('state').notNull(),
    zip_code: text('zip_code').notNull(),
    is_active: boolean('is_active').notNull().default(true),
    created_at: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull()
  },
  (table) => ({
    storeIdIdx: index('pickup_points_store_id_idx').on(table.store_id),
    storeActiveIdx: index('pickup_points_store_active_idx').on(
      table.store_id,
      table.is_active
    )
  })
)

