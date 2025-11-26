import { db, schema } from '@white-label/db'
import { eq, and, desc } from 'drizzle-orm'
import type {
  Order,
  OrderItem,
  OrderWithItems,
  ListOrdersFilters,
  UpdateOrderInput
} from '../../../domain/orders/order-types'

export class OrderRepository {
  async listByStore(storeId: string, filters?: ListOrdersFilters): Promise<Order[]> {
    const conditions = [eq(schema.orders.store_id, storeId)]

    if (filters?.status) {
      conditions.push(eq(schema.orders.status, filters.status))
    }

    if (filters?.payment_status) {
      conditions.push(eq(schema.orders.payment_status, filters.payment_status))
    }

    if (filters?.customer_id) {
      conditions.push(eq(schema.orders.customer_id, filters.customer_id))
    }

    const result = await db
      .select()
      .from(schema.orders)
      .where(and(...conditions))
      .orderBy(desc(schema.orders.created_at))

    return result.map((row) => ({
      id: row.id,
      store_id: row.store_id,
      customer_id: row.customer_id,
      total: row.total,
      status: row.status as Order['status'],
      payment_status: row.payment_status as Order['payment_status'],
      shipping_cost: row.shipping_cost,
      shipping_label_url: row.shipping_label_url,
      tracking_code: row.tracking_code,
      created_at: row.created_at
    }))
  }

  async findById(id: string, storeId: string): Promise<Order | null> {
    const result = await db
      .select()
      .from(schema.orders)
      .where(
        and(
          eq(schema.orders.id, id),
          eq(schema.orders.store_id, storeId)
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
      customer_id: row.customer_id,
      total: row.total,
      status: row.status as Order['status'],
      payment_status: row.payment_status as Order['payment_status'],
      shipping_cost: row.shipping_cost,
      shipping_label_url: row.shipping_label_url,
      tracking_code: row.tracking_code,
      created_at: row.created_at
    }
  }

  async findByIdWithItems(id: string, storeId: string): Promise<OrderWithItems | null> {
    const order = await this.findById(id, storeId)
    if (!order) {
      return null
    }

    const itemsResult = await db
      .select()
      .from(schema.orderItems)
      .where(eq(schema.orderItems.order_id, id))

    const items: OrderItem[] = itemsResult.map((row) => ({
      id: row.id,
      order_id: row.order_id,
      product_id: row.product_id,
      variant_id: row.variant_id,
      quantity: row.quantity,
      price: row.price
    }))

    return {
      ...order,
      items
    }
  }

  async update(id: string, storeId: string, data: UpdateOrderInput): Promise<Order> {
    const updateData: {
      status?: string
      payment_status?: string
      shipping_label_url?: string | null
      tracking_code?: string | null
    } = {}

    if (data.status !== undefined) {
      updateData.status = data.status
    }
    if (data.payment_status !== undefined) {
      updateData.payment_status = data.payment_status
    }
    if (data.shipping_label_url !== undefined) {
      updateData.shipping_label_url = data.shipping_label_url
    }
    if (data.tracking_code !== undefined) {
      updateData.tracking_code = data.tracking_code
    }

    const result = await db
      .update(schema.orders)
      .set(updateData)
      .where(
        and(
          eq(schema.orders.id, id),
          eq(schema.orders.store_id, storeId)
        )
      )
      .returning()

    if (result.length === 0) {
      throw new Error('Order not found')
    }

    const row = result[0]
    return {
      id: row.id,
      store_id: row.store_id,
      customer_id: row.customer_id,
      total: row.total,
      status: row.status as Order['status'],
      payment_status: row.payment_status as Order['payment_status'],
      shipping_cost: row.shipping_cost,
      shipping_label_url: row.shipping_label_url,
      tracking_code: row.tracking_code,
      created_at: row.created_at
    }
  }
}

