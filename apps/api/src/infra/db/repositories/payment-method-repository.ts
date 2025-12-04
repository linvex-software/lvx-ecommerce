import { db, schema } from '@white-label/db'
import { eq, and, desc } from 'drizzle-orm'

export interface PaymentMethod {
  id: string
  store_id: string
  name: string
  provider: string
  config_json: Record<string, unknown> | null
  active: boolean
  created_at: Date
}

export class PaymentMethodRepository {
  async findByProvider(
    storeId: string,
    provider: string
  ): Promise<PaymentMethod | null> {
    const [paymentMethod] = await db
      .select()
      .from(schema.paymentMethods)
      .where(
        and(
          eq(schema.paymentMethods.store_id, storeId),
          eq(schema.paymentMethods.provider, provider),
          eq(schema.paymentMethods.active, true)
        )
      )
      .limit(1)

    if (!paymentMethod) {
      return null
    }

    return {
      id: paymentMethod.id,
      store_id: paymentMethod.store_id,
      name: paymentMethod.name,
      provider: paymentMethod.provider,
      config_json: paymentMethod.config_json as Record<string, unknown> | null,
      active: paymentMethod.active,
      created_at: paymentMethod.created_at
    }
  }

  async listByStore(storeId: string): Promise<PaymentMethod[]> {
    const paymentMethods = await db
      .select()
      .from(schema.paymentMethods)
      .where(eq(schema.paymentMethods.store_id, storeId))
      .orderBy(desc(schema.paymentMethods.created_at))

    return paymentMethods.map((pm) => ({
      id: pm.id,
      store_id: pm.store_id,
      name: pm.name,
      provider: pm.provider,
      config_json: pm.config_json as Record<string, unknown> | null,
      active: pm.active,
      created_at: pm.created_at
    }))
  }

  async findById(id: string, storeId: string): Promise<PaymentMethod | null> {
    const [paymentMethod] = await db
      .select()
      .from(schema.paymentMethods)
      .where(
        and(
          eq(schema.paymentMethods.id, id),
          eq(schema.paymentMethods.store_id, storeId)
        )
      )
      .limit(1)

    if (!paymentMethod) {
      return null
    }

    return {
      id: paymentMethod.id,
      store_id: paymentMethod.store_id,
      name: paymentMethod.name,
      provider: paymentMethod.provider,
      config_json: paymentMethod.config_json as Record<string, unknown> | null,
      active: paymentMethod.active,
      created_at: paymentMethod.created_at
    }
  }

  async create(data: {
    store_id: string
    name: string
    provider: string
    config_json?: Record<string, unknown> | null
    active?: boolean
  }): Promise<PaymentMethod> {
    const [paymentMethod] = await db
      .insert(schema.paymentMethods)
      .values({
        store_id: data.store_id,
        name: data.name,
        provider: data.provider,
        config_json: data.config_json || null,
        active: data.active ?? true
      })
      .returning()

    return {
      id: paymentMethod.id,
      store_id: paymentMethod.store_id,
      name: paymentMethod.name,
      provider: paymentMethod.provider,
      config_json: paymentMethod.config_json as Record<string, unknown> | null,
      active: paymentMethod.active,
      created_at: paymentMethod.created_at
    }
  }

  async update(
    id: string,
    storeId: string,
    data: {
      name?: string
      config_json?: Record<string, unknown> | null
      active?: boolean
    }
  ): Promise<PaymentMethod> {
    const [paymentMethod] = await db
      .update(schema.paymentMethods)
      .set({
        ...(data.name && { name: data.name }),
        ...(data.config_json !== undefined && { config_json: data.config_json }),
        ...(data.active !== undefined && { active: data.active })
      })
      .where(
        and(
          eq(schema.paymentMethods.id, id),
          eq(schema.paymentMethods.store_id, storeId)
        )
      )
      .returning()

    return {
      id: paymentMethod.id,
      store_id: paymentMethod.store_id,
      name: paymentMethod.name,
      provider: paymentMethod.provider,
      config_json: paymentMethod.config_json as Record<string, unknown> | null,
      active: paymentMethod.active,
      created_at: paymentMethod.created_at
    }
  }
}


