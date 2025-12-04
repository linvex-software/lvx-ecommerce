import { db, schema } from '@white-label/db'
import { eq, and } from 'drizzle-orm'
import type {
  PickupPoint,
  CreatePickupPointInput,
  UpdatePickupPointInput
} from '../../../domain/pickup-points/pickup-point-types'

export class PickupPointRepository {
  async listByStore(storeId: string, activeOnly: boolean = false): Promise<PickupPoint[]> {
    const conditions = [eq(schema.pickupPoints.store_id, storeId)]

    if (activeOnly) {
      conditions.push(eq(schema.pickupPoints.is_active, true))
    }

    const result = await db
      .select()
      .from(schema.pickupPoints)
      .where(and(...conditions))

    return result.map((row) => ({
      id: row.id,
      store_id: row.store_id,
      name: row.name,
      street: row.street,
      number: row.number,
      complement: row.complement,
      neighborhood: row.neighborhood,
      city: row.city,
      state: row.state,
      zip_code: row.zip_code,
      is_active: row.is_active,
      created_at: row.created_at
    }))
  }

  async findById(id: string, storeId: string): Promise<PickupPoint | null> {
    const result = await db
      .select()
      .from(schema.pickupPoints)
      .where(
        and(
          eq(schema.pickupPoints.id, id),
          eq(schema.pickupPoints.store_id, storeId)
        )
      )
      .limit(1)

    if (result.length === 0) {
      return null
    }

    const row = result[0]
    return {
      id: row.id,
      store_id: row.store_id,
      name: row.name,
      street: row.street,
      number: row.number,
      complement: row.complement,
      neighborhood: row.neighborhood,
      city: row.city,
      state: row.state,
      zip_code: row.zip_code,
      is_active: row.is_active,
      created_at: row.created_at
    }
  }

  async create(data: CreatePickupPointInput): Promise<PickupPoint> {
    const result = await db
      .insert(schema.pickupPoints)
      .values({
        store_id: data.store_id,
        name: data.name,
        street: data.street,
        number: data.number,
        complement: data.complement ?? null,
        neighborhood: data.neighborhood,
        city: data.city,
        state: data.state,
        zip_code: data.zip_code,
        is_active: data.is_active ?? true
      })
      .returning()

    const row = result[0]
    return {
      id: row.id,
      store_id: row.store_id,
      name: row.name,
      street: row.street,
      number: row.number,
      complement: row.complement,
      neighborhood: row.neighborhood,
      city: row.city,
      state: row.state,
      zip_code: row.zip_code,
      is_active: row.is_active,
      created_at: row.created_at
    }
  }

  async update(
    id: string,
    storeId: string,
    data: UpdatePickupPointInput
  ): Promise<PickupPoint | null> {
    const result = await db
      .update(schema.pickupPoints)
      .set({
        ...(data.name !== undefined && { name: data.name }),
        ...(data.street !== undefined && { street: data.street }),
        ...(data.number !== undefined && { number: data.number }),
        ...(data.complement !== undefined && { complement: data.complement }),
        ...(data.neighborhood !== undefined && { neighborhood: data.neighborhood }),
        ...(data.city !== undefined && { city: data.city }),
        ...(data.state !== undefined && { state: data.state }),
        ...(data.zip_code !== undefined && { zip_code: data.zip_code }),
        ...(data.is_active !== undefined && { is_active: data.is_active })
      })
      .where(
        and(
          eq(schema.pickupPoints.id, id),
          eq(schema.pickupPoints.store_id, storeId)
        )
      )
      .returning()

    if (result.length === 0) {
      return null
    }

    const row = result[0]
    return {
      id: row.id,
      store_id: row.store_id,
      name: row.name,
      street: row.street,
      number: row.number,
      complement: row.complement,
      neighborhood: row.neighborhood,
      city: row.city,
      state: row.state,
      zip_code: row.zip_code,
      is_active: row.is_active,
      created_at: row.created_at
    }
  }

  async delete(id: string, storeId: string): Promise<boolean> {
    const result = await db
      .delete(schema.pickupPoints)
      .where(
        and(
          eq(schema.pickupPoints.id, id),
          eq(schema.pickupPoints.store_id, storeId)
        )
      )
      .returning()

    return result.length > 0
  }
}

