import { db, schema } from '@white-label/db'
import { eq, and, desc, lt, sql } from 'drizzle-orm'
import type {
  PhysicalSalesCart,
  CreatePhysicalSalesCartInput,
  UpdatePhysicalSalesCartInput,
  PhysicalSalesCartStatus
} from '../../../domain/physical-sales/physical-sales-types'

export class PhysicalSalesCartRepository {
  async create(
    data: CreatePhysicalSalesCartInput,
    storeId: string,
    sellerUserId: string
  ): Promise<PhysicalSalesCart> {
    const result = await db
      .insert(schema.physicalSalesCarts)
      .values({
        store_id: storeId,
        seller_user_id: sellerUserId,
        items_json: JSON.stringify(data.items),
        total: data.items.reduce((sum, item) => sum + item.price * item.quantity, 0).toString(),
        coupon_code: data.coupon_code ?? null,
        shipping_address: data.shipping_address ?? null,
        status: 'active'
      })
      .returning()

    return this.mapRowToCart(result[0])
  }

  async findById(id: string, storeId: string): Promise<PhysicalSalesCart | null> {
    const result = await db
      .select()
      .from(schema.physicalSalesCarts)
      .where(
        and(
          eq(schema.physicalSalesCarts.id, id),
          eq(schema.physicalSalesCarts.store_id, storeId)
        )
      )
      .limit(1)

    if (result.length === 0) {
      return null
    }

    return this.mapRowToCart(result[0])
  }

  async findBySeller(
    storeId: string,
    sellerUserId: string,
    status?: PhysicalSalesCartStatus
  ): Promise<PhysicalSalesCart[]> {
    const conditions = [
      eq(schema.physicalSalesCarts.store_id, storeId),
      eq(schema.physicalSalesCarts.seller_user_id, sellerUserId)
    ]

    if (status) {
      conditions.push(eq(schema.physicalSalesCarts.status, status))
    }

    const result = await db
      .select()
      .from(schema.physicalSalesCarts)
      .where(and(...conditions))
      .orderBy(desc(schema.physicalSalesCarts.last_activity_at))

    return result.map((row) => this.mapRowToCart(row))
  }

  async update(
    id: string,
    storeId: string,
    data: UpdatePhysicalSalesCartInput
  ): Promise<PhysicalSalesCart> {
    const updateData: {
      items_json?: string
      total?: string
      coupon_code?: string | null
      shipping_address?: string | null
      last_activity_at?: Date
      updated_at?: Date
    } = {
      last_activity_at: new Date(),
      updated_at: new Date()
    }

    if (data.items !== undefined) {
      updateData.items_json = JSON.stringify(data.items)
      updateData.total = data.items
        .reduce((sum, item) => sum + item.price * item.quantity, 0)
        .toString()
    }

    if (data.coupon_code !== undefined) {
      updateData.coupon_code = data.coupon_code
    }

    if (data.shipping_address !== undefined) {
      updateData.shipping_address = data.shipping_address
    }

    const result = await db
      .update(schema.physicalSalesCarts)
      .set(updateData)
      .where(
        and(
          eq(schema.physicalSalesCarts.id, id),
          eq(schema.physicalSalesCarts.store_id, storeId)
        )
      )
      .returning()

    if (result.length === 0) {
      throw new Error('Cart not found')
    }

    return this.mapRowToCart(result[0])
  }

  async updateStatus(
    id: string,
    storeId: string,
    status: PhysicalSalesCartStatus
  ): Promise<void> {
    await db
      .update(schema.physicalSalesCarts)
      .set({
        status,
        updated_at: new Date()
      })
      .where(
        and(
          eq(schema.physicalSalesCarts.id, id),
          eq(schema.physicalSalesCarts.store_id, storeId)
        )
      )
  }

  async markAbandoned(storeId: string, hoursInactive: number = 24): Promise<number> {
    const cutoffDate = new Date()
    cutoffDate.setHours(cutoffDate.getHours() - hoursInactive)

    const result = await db
      .update(schema.physicalSalesCarts)
      .set({
        status: 'abandoned',
        updated_at: new Date()
      })
      .where(
        and(
          eq(schema.physicalSalesCarts.store_id, storeId),
          eq(schema.physicalSalesCarts.status, 'active'),
          lt(schema.physicalSalesCarts.last_activity_at, cutoffDate)
        )
      )
      .returning()

    return result.length
  }

  private mapRowToCart(row: typeof schema.physicalSalesCarts.$inferSelect): PhysicalSalesCart {
    return {
      id: row.id,
      store_id: row.store_id,
      seller_user_id: row.seller_user_id,
      status: row.status as PhysicalSalesCartStatus,
      items: typeof row.items_json === 'string' ? JSON.parse(row.items_json) : row.items_json,
      total: row.total,
      coupon_code: row.coupon_code,
      shipping_address: row.shipping_address,
      last_activity_at: row.last_activity_at,
      created_at: row.created_at,
      updated_at: row.updated_at
    }
  }
}

