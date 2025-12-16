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
    const subtotal = data.items.reduce((sum, item) => {
      const itemTotal = item.price * item.quantity
      const itemDiscount = item.discount ?? 0
      return sum + itemTotal - itemDiscount
    }, 0)

    const result = await db
      .insert(schema.physicalSalesCarts)
      .values({
        store_id: storeId,
        seller_user_id: sellerUserId,
        customer_id: data.customer_id ?? null,
        items_json: data.items,
        total: subtotal.toString(),
        discount_amount: '0',
        coupon_code: data.coupon_code ?? null,
        shipping_address: data.shipping_address ?? null,
        origin: data.origin ?? null,
        commission_rate: data.commission_rate ? data.commission_rate.toString() : null,
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
      items_json?: typeof schema.physicalSalesCarts.$inferInsert['items_json']
      total?: string
      customer_id?: string | null
      discount_amount?: string
      coupon_code?: string | null
      shipping_address?: string | null
      origin?: string | null
      commission_rate?: string | null
      seller_user_id?: string
      last_activity_at?: Date
      updated_at?: Date
    } = {
      last_activity_at: new Date(),
      updated_at: new Date()
    }

    if (data.items !== undefined) {
      updateData.items_json = data.items
      const subtotal = data.items.reduce((sum, item) => {
        const itemTotal = item.price * item.quantity
        const itemDiscount = item.discount ?? 0
        return sum + itemTotal - itemDiscount
      }, 0)
      updateData.total = subtotal.toString()
    }

    if (data.customer_id !== undefined) {
      updateData.customer_id = data.customer_id
    }

    if (data.discount_amount !== undefined && data.discount_amount !== null) {
      updateData.discount_amount = data.discount_amount.toString()
    }

    if (data.coupon_code !== undefined) {
      updateData.coupon_code = data.coupon_code
    }

    if (data.shipping_address !== undefined) {
      updateData.shipping_address = data.shipping_address
    }

    if (data.origin !== undefined) {
      updateData.origin = data.origin
    }

    if (data.commission_rate !== undefined) {
      updateData.commission_rate = data.commission_rate ? data.commission_rate.toString() : null
    }

    if (data.seller_user_id !== undefined && data.seller_user_id !== null) {
      updateData.seller_user_id = data.seller_user_id
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
      customer_id: row.customer_id ?? null,
      status: row.status as PhysicalSalesCartStatus,
      items: typeof row.items_json === 'string' ? JSON.parse(row.items_json) : row.items_json,
      total: row.total,
      discount_amount: row.discount_amount ?? '0',
      coupon_code: row.coupon_code,
      shipping_address: row.shipping_address,
      origin: row.origin ?? null,
      commission_rate: row.commission_rate ?? null,
      last_activity_at: row.last_activity_at,
      created_at: row.created_at,
      updated_at: row.updated_at
    }
  }
}

