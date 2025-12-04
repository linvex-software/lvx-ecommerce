import { eq } from 'drizzle-orm'
import { db, schema } from '@white-label/db'

export interface StoreLayout {
  id: string
  store_id: string
  layout_json: Record<string, unknown>
  created_at: Date
  updated_at: Date
}

export interface CreateStoreLayoutInput {
  store_id: string
  layout_json: Record<string, unknown>
}

export interface UpdateStoreLayoutInput {
  layout_json: Record<string, unknown>
}

export class StoreLayoutRepository {
  async findByStoreId(storeId: string): Promise<StoreLayout | null> {
    const result = await db
      .select()
      .from(schema.storeLayouts)
      .where(eq(schema.storeLayouts.store_id, storeId))
      .limit(1)

    if (result.length === 0) {
      return null
    }

    const row = result[0]
    return {
      id: row.id,
      store_id: row.store_id,
      layout_json: row.layout_json as Record<string, unknown>,
      created_at: row.created_at,
      updated_at: row.updated_at
    }
  }

  async create(input: CreateStoreLayoutInput): Promise<StoreLayout> {
    const result = await db
      .insert(schema.storeLayouts)
      .values({
        store_id: input.store_id,
        layout_json: input.layout_json
      })
      .returning()

    const row = result[0]
    return {
      id: row.id,
      store_id: row.store_id,
      layout_json: row.layout_json as Record<string, unknown>,
      created_at: row.created_at,
      updated_at: row.updated_at
    }
  }

  async update(storeId: string, input: UpdateStoreLayoutInput): Promise<StoreLayout> {
    const result = await db
      .update(schema.storeLayouts)
      .set({
        layout_json: input.layout_json,
        updated_at: new Date()
      })
      .where(eq(schema.storeLayouts.store_id, storeId))
      .returning()

    if (result.length === 0) {
      throw new Error('Layout not found')
    }

    const row = result[0]
    return {
      id: row.id,
      store_id: row.store_id,
      layout_json: row.layout_json as Record<string, unknown>,
      created_at: row.created_at,
      updated_at: row.updated_at
    }
  }

  async upsert(input: CreateStoreLayoutInput): Promise<StoreLayout> {
    const existing = await this.findByStoreId(input.store_id)

    if (existing) {
      return this.update(input.store_id, { layout_json: input.layout_json })
    }

    return this.create(input)
  }
}

