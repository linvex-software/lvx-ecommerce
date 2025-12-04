import { db, schema } from '@white-label/db'
import { eq, and } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import type {
  Customer,
  RegisterCustomerInput,
  UpdateCustomerProfileInput
} from '../../../domain/customers/customer-types'

export class CustomerRepository {
  async findByCpf(cpf: string, storeId: string): Promise<Customer | null> {
    const result = await db
      .select()
      .from(schema.customers)
      .where(
        and(
          eq(schema.customers.store_id, storeId),
          eq(schema.customers.cpf, cpf)
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
      email: row.email,
      cpf: row.cpf,
      phone: row.phone,
      password_hash: row.password_hash,
      created_at: row.created_at
    }
  }

  async findById(id: string, storeId: string): Promise<Customer | null> {
    const result = await db
      .select()
      .from(schema.customers)
      .where(
        and(
          eq(schema.customers.id, id),
          eq(schema.customers.store_id, storeId)
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
      email: row.email,
      cpf: row.cpf,
      phone: row.phone,
      password_hash: row.password_hash,
      created_at: row.created_at
    }
  }

  async findByEmail(email: string, storeId: string): Promise<Customer | null> {
    const result = await db
      .select()
      .from(schema.customers)
      .where(
        and(
          eq(schema.customers.store_id, storeId),
          eq(schema.customers.email, email)
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
      email: row.email,
      cpf: row.cpf,
      phone: row.phone,
      password_hash: row.password_hash,
      created_at: row.created_at
    }
  }

  async create(
    data: RegisterCustomerInput,
    storeId: string
  ): Promise<Customer> {
    const passwordHash = await bcrypt.hash(data.password, 10)

    const result = await db
      .insert(schema.customers)
      .values({
        store_id: storeId,
        name: data.name,
        email: data.email ?? null,
        cpf: data.cpf,
        phone: data.phone ?? null,
        password_hash: passwordHash
      })
      .returning()

    const row = result[0]
    return {
      id: row.id,
      store_id: row.store_id,
      name: row.name,
      email: row.email,
      cpf: row.cpf,
      phone: row.phone,
      password_hash: row.password_hash,
      created_at: row.created_at
    }
  }

  async update(
    id: string,
    storeId: string,
    data: UpdateCustomerProfileInput
  ): Promise<Customer> {
    const updateData: {
      name?: string
      email?: string | null
      phone?: string | null
    } = {}

    if (data.name !== undefined) {
      updateData.name = data.name
    }
    if (data.email !== undefined) {
      updateData.email = data.email
    }
    if (data.phone !== undefined) {
      updateData.phone = data.phone
    }

    const result = await db
      .update(schema.customers)
      .set(updateData)
      .where(
        and(
          eq(schema.customers.id, id),
          eq(schema.customers.store_id, storeId)
        )
      )
      .returning()

    if (result.length === 0) {
      throw new Error('Customer not found')
    }

    const row = result[0]
    return {
      id: row.id,
      store_id: row.store_id,
      name: row.name,
      email: row.email,
      cpf: row.cpf,
      phone: row.phone,
      password_hash: row.password_hash,
      created_at: row.created_at
    }
  }

  async updatePassword(
    id: string,
    storeId: string,
    passwordHash: string
  ): Promise<void> {
    const result = await db
      .update(schema.customers)
      .set({ password_hash: passwordHash })
      .where(
        and(
          eq(schema.customers.id, id),
          eq(schema.customers.store_id, storeId)
        )
      )
      .returning()

    if (result.length === 0) {
      throw new Error('Customer not found')
    }
  }
}

