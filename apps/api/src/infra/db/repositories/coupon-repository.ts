import { db, schema } from '@white-label/db'
import { eq, and, sql } from 'drizzle-orm'
import type { Coupon, CreateCouponInput, UpdateCouponInput } from '../../../domain/coupons/coupon-types'

export class CouponRepository {
  async listByStore(storeId: string): Promise<Coupon[]> {
    const result = await db
      .select()
      .from(schema.coupons)
      .where(eq(schema.coupons.store_id, storeId))

    return result.map((row) => ({
      id: row.id,
      store_id: row.store_id,
      code: row.code,
      type: row.type as 'percent' | 'fixed',
      value: row.value,
      min_value: row.min_value,
      max_uses: row.max_uses,
      used_count: row.used_count,
      expires_at: row.expires_at,
      active: row.active,
      created_at: row.created_at
    }))
  }

  async findById(id: string, storeId: string): Promise<Coupon | null> {
    const result = await db
      .select()
      .from(schema.coupons)
      .where(
        and(
          eq(schema.coupons.id, id),
          eq(schema.coupons.store_id, storeId)
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
      code: row.code,
      type: row.type as 'percent' | 'fixed',
      value: row.value,
      min_value: row.min_value,
      max_uses: row.max_uses,
      used_count: row.used_count,
      expires_at: row.expires_at,
      active: row.active,
      created_at: row.created_at
    }
  }

  async findByCode(storeId: string, code: string): Promise<Coupon | null> {
    const normalizedCode = code.toUpperCase().trim()
    
    const result = await db
      .select()
      .from(schema.coupons)
      .where(
        and(
          eq(schema.coupons.store_id, storeId),
          eq(schema.coupons.code, normalizedCode)
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
      code: row.code,
      type: row.type as 'percent' | 'fixed',
      value: row.value,
      min_value: row.min_value,
      max_uses: row.max_uses,
      used_count: row.used_count,
      expires_at: row.expires_at,
      active: row.active,
      created_at: row.created_at
    }
  }

  async create(data: CreateCouponInput): Promise<Coupon> {
    const normalizedCode = data.code.toUpperCase().trim()
    
    const result = await db
      .insert(schema.coupons)
      .values({
        store_id: data.store_id,
        code: normalizedCode,
        type: data.type,
        value: data.value.toString(),
        min_value: data.min_value ? data.min_value.toString() : null,
        max_uses: data.max_uses ?? null,
        expires_at: data.expires_at ?? null,
        active: true
      })
      .returning()

    const row = result[0]
    return {
      id: row.id,
      store_id: row.store_id,
      code: row.code,
      type: row.type as 'percent' | 'fixed',
      value: row.value,
      min_value: row.min_value,
      max_uses: row.max_uses,
      used_count: row.used_count,
      expires_at: row.expires_at,
      active: row.active,
      created_at: row.created_at
    }
  }

  async update(id: string, storeId: string, data: UpdateCouponInput): Promise<Coupon> {
    const updateData: {
      code?: string
      type?: string
      value?: string
      min_value?: string | null
      max_uses?: number | null
      expires_at?: Date | null
      active?: boolean
    } = {}

    if (data.code !== undefined) {
      updateData.code = data.code.toUpperCase().trim()
    }
    if (data.type !== undefined) {
      updateData.type = data.type
    }
    if (data.value !== undefined) {
      updateData.value = data.value.toString()
    }
    if (data.min_value !== undefined) {
      updateData.min_value = data.min_value ? data.min_value.toString() : null
    }
    if (data.max_uses !== undefined) {
      updateData.max_uses = data.max_uses
    }
    if (data.expires_at !== undefined) {
      updateData.expires_at = data.expires_at
    }
    if (data.active !== undefined) {
      updateData.active = data.active
    }

    const result = await db
      .update(schema.coupons)
      .set(updateData)
      .where(
        and(
          eq(schema.coupons.id, id),
          eq(schema.coupons.store_id, storeId)
        )
      )
      .returning()

    if (result.length === 0) {
      throw new Error('Coupon not found')
    }

    const row = result[0]
    return {
      id: row.id,
      store_id: row.store_id,
      code: row.code,
      type: row.type as 'percent' | 'fixed',
      value: row.value,
      min_value: row.min_value,
      max_uses: row.max_uses,
      used_count: row.used_count,
      expires_at: row.expires_at,
      active: row.active,
      created_at: row.created_at
    }
  }

  async softDelete(id: string, storeId: string): Promise<void> {
    const result = await db
      .update(schema.coupons)
      .set({ active: false })
      .where(
        and(
          eq(schema.coupons.id, id),
          eq(schema.coupons.store_id, storeId)
        )
      )
      .returning()

    if (result.length === 0) {
      throw new Error('Coupon not found')
    }
  }

  async incrementUsedCount(id: string, storeId: string): Promise<void> {
    await db
      .update(schema.coupons)
      .set({
        used_count: sql`${schema.coupons.used_count} + 1`
      })
      .where(
        and(
          eq(schema.coupons.id, id),
          eq(schema.coupons.store_id, storeId)
        )
      )
  }
}

