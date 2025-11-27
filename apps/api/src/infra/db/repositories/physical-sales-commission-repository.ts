import { db, schema } from '@white-label/db'
import { eq, and, desc } from 'drizzle-orm'
import type {
  PhysicalSaleCommission,
  CommissionStatus
} from '../../../domain/physical-sales/physical-sales-types'

export class PhysicalSalesCommissionRepository {
  async create(data: {
    store_id: string
    physical_sale_id: string
    seller_user_id: string
    commission_amount: number // em centavos
    commission_rate?: number | null // porcentagem
  }): Promise<PhysicalSaleCommission> {
    const result = await db
      .insert(schema.physicalSalesCommissions)
      .values({
        store_id: data.store_id,
        physical_sale_id: data.physical_sale_id,
        seller_user_id: data.seller_user_id,
        commission_amount: data.commission_amount.toString(),
        commission_rate: data.commission_rate ? data.commission_rate.toString() : null,
        status: 'pending'
      })
      .returning()

    return this.mapRowToCommission(result[0])
  }

  async findBySaleId(
    physicalSaleId: string,
    storeId: string
  ): Promise<PhysicalSaleCommission | null> {
    const result = await db
      .select()
      .from(schema.physicalSalesCommissions)
      .where(
        and(
          eq(schema.physicalSalesCommissions.physical_sale_id, physicalSaleId),
          eq(schema.physicalSalesCommissions.store_id, storeId)
        )
      )
      .limit(1)

    if (result.length === 0) {
      return null
    }

    return this.mapRowToCommission(result[0])
  }

  async findBySeller(
    storeId: string,
    sellerUserId: string,
    status?: CommissionStatus
  ): Promise<PhysicalSaleCommission[]> {
    const conditions = [
      eq(schema.physicalSalesCommissions.store_id, storeId),
      eq(schema.physicalSalesCommissions.seller_user_id, sellerUserId)
    ]

    if (status) {
      conditions.push(eq(schema.physicalSalesCommissions.status, status))
    }

    const result = await db
      .select()
      .from(schema.physicalSalesCommissions)
      .where(and(...conditions))
      .orderBy(desc(schema.physicalSalesCommissions.created_at))

    return result.map((row) => this.mapRowToCommission(row))
  }

  async updateStatus(
    id: string,
    storeId: string,
    status: CommissionStatus,
    paidAt?: Date | null
  ): Promise<void> {
    const updateData: {
      status: string
      paid_at?: Date | null
    } = {
      status
    }

    if (status === 'paid' && paidAt) {
      updateData.paid_at = paidAt
    } else if (status !== 'paid') {
      updateData.paid_at = null
    }

    await db
      .update(schema.physicalSalesCommissions)
      .set(updateData)
      .where(
        and(
          eq(schema.physicalSalesCommissions.id, id),
          eq(schema.physicalSalesCommissions.store_id, storeId)
        )
      )
  }

  private mapRowToCommission(
    row: typeof schema.physicalSalesCommissions.$inferSelect
  ): PhysicalSaleCommission {
    return {
      id: row.id,
      store_id: row.store_id,
      physical_sale_id: row.physical_sale_id,
      seller_user_id: row.seller_user_id,
      commission_amount: row.commission_amount,
      commission_rate: row.commission_rate,
      status: row.status as CommissionStatus,
      paid_at: row.paid_at,
      created_at: row.created_at
    }
  }
}

