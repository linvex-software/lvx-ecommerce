import { db, schema } from '@white-label/db'
import { eq, and, or, desc } from 'drizzle-orm'
import type {
  Cart,
  CreateCartInput,
  UpdateCartInput,
  CartStatus
} from '../../../domain/carts/cart-types'

export class CartRepository {
  async create(
    data: CreateCartInput,
    storeId: string
  ): Promise<Cart> {
    // Recalcular total (não confiar no input)
    const total = data.items.reduce((sum, item) => {
      const itemTotal = item.price * item.quantity
      if (!Number.isFinite(itemTotal) || itemTotal < 0) {
        throw new Error(`Invalid item total for product ${item.product_id}`)
      }
      return sum + itemTotal
    }, 0)

    if (!Number.isFinite(total) || total < 0) {
      throw new Error('Invalid cart total')
    }

    const result = await db
      .insert(schema.carts)
      .values({
        store_id: storeId,
        customer_id: data.customer_id ?? null,
        session_id: data.session_id ?? null,
        items_json: data.items,
        total: total.toString(),
        coupon_code: data.coupon_code ?? null,
        status: 'active'
      })
      .returning()

    return this.mapRowToCart(result[0])
  }

  async findById(id: string, storeId: string): Promise<Cart | null> {
    const result = await db
      .select()
      .from(schema.carts)
      .where(
        and(
          eq(schema.carts.id, id),
          eq(schema.carts.store_id, storeId)
        )
      )
      .limit(1)

    if (result.length === 0) {
      return null
    }

    return this.mapRowToCart(result[0])
  }

  async findBySessionOrCustomer(
    storeId: string,
    sessionId?: string | null,
    customerId?: string | null
  ): Promise<Cart | null> {
    const baseConditions = [
      eq(schema.carts.store_id, storeId),
      eq(schema.carts.status, 'active')
    ]

    // Se tem ambos, busca por qualquer um (OR)
    if (sessionId && customerId) {
      const result = await db
        .select()
        .from(schema.carts)
        .where(
          and(
            ...baseConditions,
            or(
              eq(schema.carts.session_id, sessionId),
              eq(schema.carts.customer_id, customerId)
            )
          )
        )
        .orderBy(desc(schema.carts.last_activity_at))
        .limit(1)

      if (result.length > 0) {
        return this.mapRowToCart(result[0])
      }
      return null
    }

    // Se tem apenas session_id
    if (sessionId) {
      const result = await db
        .select()
        .from(schema.carts)
        .where(
          and(
            ...baseConditions,
            eq(schema.carts.session_id, sessionId)
          )
        )
        .orderBy(desc(schema.carts.last_activity_at))
        .limit(1)

      if (result.length > 0) {
        return this.mapRowToCart(result[0])
      }
    }

    // Se tem apenas customer_id
    if (customerId) {
      const result = await db
        .select()
        .from(schema.carts)
        .where(
          and(
            ...baseConditions,
            eq(schema.carts.customer_id, customerId)
          )
        )
        .orderBy(desc(schema.carts.last_activity_at))
        .limit(1)

      if (result.length > 0) {
        return this.mapRowToCart(result[0])
      }
    }

    return null
  }

  async upsert(
    data: CreateCartInput,
    storeId: string,
    existingCartId?: string
  ): Promise<Cart> {
    if (existingCartId) {
      return this.update(existingCartId, storeId, data)
    }

    // Verificar se já existe carrinho para session/customer
    const existing = await this.findBySessionOrCustomer(
      storeId,
      data.session_id,
      data.customer_id
    )

    if (existing) {
      return this.update(existing.id, storeId, data)
    }

    return this.create(data, storeId)
  }

  async update(
    id: string,
    storeId: string,
    data: UpdateCartInput
  ): Promise<Cart> {
    const updateData: {
      items_json?: typeof schema.carts.$inferInsert['items_json']
      total?: string
      coupon_code?: string | null
      last_activity_at?: Date
      updated_at?: Date
    } = {
      last_activity_at: new Date(),
      updated_at: new Date()
    }

    if (data.items !== undefined) {
      // Recalcular total (não confiar no input)
      const total = data.items.reduce((sum, item) => {
        const itemTotal = item.price * item.quantity
        if (!Number.isFinite(itemTotal) || itemTotal < 0) {
          throw new Error(`Invalid item total for product ${item.product_id}`)
        }
        return sum + itemTotal
      }, 0)

      if (!Number.isFinite(total) || total < 0) {
        throw new Error('Invalid cart total')
      }

      updateData.items_json = data.items
      updateData.total = total.toString()
    }

    if (data.coupon_code !== undefined) {
      updateData.coupon_code = data.coupon_code
    }

    const result = await db
      .update(schema.carts)
      .set(updateData)
      .where(
        and(
          eq(schema.carts.id, id),
          eq(schema.carts.store_id, storeId)
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
    status: CartStatus
  ): Promise<void> {
    await db
      .update(schema.carts)
      .set({
        status,
        updated_at: new Date()
      })
      .where(
        and(
          eq(schema.carts.id, id),
          eq(schema.carts.store_id, storeId)
        )
      )
  }

  private mapRowToCart(row: typeof schema.carts.$inferSelect): Cart {
    return {
      id: row.id,
      store_id: row.store_id,
      customer_id: row.customer_id,
      session_id: row.session_id,
      status: row.status as CartStatus,
      items: typeof row.items_json === 'string' ? JSON.parse(row.items_json) : row.items_json,
      total: row.total,
      coupon_code: row.coupon_code,
      last_activity_at: row.last_activity_at,
      created_at: row.created_at,
      updated_at: row.updated_at
    }
  }
}

