import { db, schema } from '@white-label/db'
import { eq, and, ne } from 'drizzle-orm'
import type {
  CustomerAddress,
  CreateCustomerAddressInput,
  UpdateCustomerAddressInput
} from '../../../domain/customers/customer-types'

export class CustomerAddressRepository {
  async findByCustomerId(customerId: string): Promise<CustomerAddress[]> {
    const result = await db
      .select()
      .from(schema.customerAddresses)
      .where(eq(schema.customerAddresses.customer_id, customerId))

    return result.map((row) => ({
      id: row.id,
      customer_id: row.customer_id,
      street: row.street,
      city: row.city,
      state: row.state,
      zip: row.zip,
      is_default: row.is_default
    }))
  }

  async findById(id: string, customerId: string): Promise<CustomerAddress | null> {
    const result = await db
      .select()
      .from(schema.customerAddresses)
      .where(
        and(
          eq(schema.customerAddresses.id, id),
          eq(schema.customerAddresses.customer_id, customerId)
        )
      )
      .limit(1)

    if (result.length === 0) {
      return null
    }

    const row = result[0]
    return {
      id: row.id,
      customer_id: row.customer_id,
      street: row.street,
      city: row.city,
      state: row.state,
      zip: row.zip,
      is_default: row.is_default
    }
  }

  async create(
    customerId: string,
    data: CreateCustomerAddressInput
  ): Promise<CustomerAddress> {
    // Se este endereço for marcado como padrão, desmarcar todos os outros
    if (data.is_default) {
      await db
        .update(schema.customerAddresses)
        .set({ is_default: false })
        .where(eq(schema.customerAddresses.customer_id, customerId))
    }

    const result = await db
      .insert(schema.customerAddresses)
      .values({
        customer_id: customerId,
        street: data.street,
        city: data.city,
        state: data.state,
        zip: data.zip,
        is_default: data.is_default ?? false
      })
      .returning()

    const row = result[0]
    return {
      id: row.id,
      customer_id: row.customer_id,
      street: row.street,
      city: row.city,
      state: row.state,
      zip: row.zip,
      is_default: row.is_default
    }
  }

  async update(
    id: string,
    customerId: string,
    data: UpdateCustomerAddressInput
  ): Promise<CustomerAddress> {
    // Se este endereço for marcado como padrão, desmarcar todos os outros
    if (data.is_default) {
      await db
        .update(schema.customerAddresses)
        .set({ is_default: false })
        .where(
          and(
            eq(schema.customerAddresses.customer_id, customerId),
            ne(schema.customerAddresses.id, id) // Excluir o endereço atual
          )
        )
    }

    const updateData: {
      street?: string
      city?: string
      state?: string
      zip?: string
      is_default?: boolean
    } = {}

    if (data.street !== undefined) {
      updateData.street = data.street
    }
    if (data.city !== undefined) {
      updateData.city = data.city
    }
    if (data.state !== undefined) {
      updateData.state = data.state
    }
    if (data.zip !== undefined) {
      updateData.zip = data.zip
    }
    if (data.is_default !== undefined) {
      updateData.is_default = data.is_default
    }

    const result = await db
      .update(schema.customerAddresses)
      .set(updateData)
      .where(
        and(
          eq(schema.customerAddresses.id, id),
          eq(schema.customerAddresses.customer_id, customerId)
        )
      )
      .returning()

    if (result.length === 0) {
      throw new Error('Address not found')
    }

    const row = result[0]
    return {
      id: row.id,
      customer_id: row.customer_id,
      street: row.street,
      city: row.city,
      state: row.state,
      zip: row.zip,
      is_default: row.is_default
    }
  }

  async delete(id: string, customerId: string): Promise<void> {
    const result = await db
      .delete(schema.customerAddresses)
      .where(
        and(
          eq(schema.customerAddresses.id, id),
          eq(schema.customerAddresses.customer_id, customerId)
        )
      )
      .returning()

    if (result.length === 0) {
      throw new Error('Address not found')
    }
  }

  async setDefault(id: string, customerId: string): Promise<CustomerAddress> {
    // Desmarcar todos os endereços do cliente como padrão
    await db
      .update(schema.customerAddresses)
      .set({ is_default: false })
      .where(eq(schema.customerAddresses.customer_id, customerId))

    // Marcar este endereço como padrão
    const result = await db
      .update(schema.customerAddresses)
      .set({ is_default: true })
      .where(
        and(
          eq(schema.customerAddresses.id, id),
          eq(schema.customerAddresses.customer_id, customerId)
        )
      )
      .returning()

    if (result.length === 0) {
      throw new Error('Address not found')
    }

    const row = result[0]
    return {
      id: row.id,
      customer_id: row.customer_id,
      street: row.street,
      city: row.city,
      state: row.state,
      zip: row.zip,
      is_default: row.is_default
    }
  }
}

