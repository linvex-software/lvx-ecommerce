import { db, schema } from '@white-label/db'
import { eq, and } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import type { User, UserWithStore } from '../../../domain/users/user-types'

export interface CreateUserInput {
  store_id: string
  name: string
  email: string
  password: string
  role: 'admin' | 'operador' | 'vendedor'
}

export class UserRepository {
  async findByEmailWithStore(
    email: string,
    storeId: string
  ): Promise<UserWithStore | null> {
    const result = await db
      .select({
        id: schema.users.id,
        store_id: schema.users.store_id,
        name: schema.users.name,
        email: schema.users.email,
        password_hash: schema.users.password_hash,
        role: schema.users.role,
        created_at: schema.users.created_at,
        store: {
          id: schema.stores.id,
          name: schema.stores.name,
          domain: schema.stores.domain,
          active: schema.stores.active
        }
      })
      .from(schema.users)
      .innerJoin(schema.stores, eq(schema.users.store_id, schema.stores.id))
      .where(
        and(
          eq(schema.users.email, email),
          eq(schema.users.store_id, storeId)
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
      password_hash: row.password_hash,
      role: row.role as User['role'],
      created_at: row.created_at,
      store: row.store
    }
  }

  async findByEmail(email: string): Promise<UserWithStore | null> {
    // Buscar usuário primeiro (sem join para garantir que password_hash seja retornado)
    const userResult = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1)

    if (userResult.length === 0) {
      return null
    }

    const userRow = userResult[0]

    // Se não tiver store_id, retornar usuário sem store
    if (!userRow.store_id) {
      return {
        id: userRow.id,
        store_id: null,
        name: userRow.name,
        email: userRow.email,
        password_hash: userRow.password_hash,
        role: userRow.role as User['role'],
        created_at: userRow.created_at,
        store: null
      }
    }

    // Buscar store separadamente
    const storeResult = await db
      .select()
      .from(schema.stores)
      .where(eq(schema.stores.id, userRow.store_id))
      .limit(1)

    if (storeResult.length === 0) {
      // Store não existe ou foi deletada, retornar usuário sem store
      return {
        id: userRow.id,
        store_id: null,
        name: userRow.name,
        email: userRow.email,
        password_hash: userRow.password_hash,
        role: userRow.role as User['role'],
        created_at: userRow.created_at,
        store: null
      }
    }

    const storeRow = storeResult[0]

    return {
      id: userRow.id,
      store_id: userRow.store_id,
      name: userRow.name,
      email: userRow.email,
      password_hash: userRow.password_hash,
      role: userRow.role as User['role'],
      created_at: userRow.created_at,
      store: {
        id: storeRow.id,
        name: storeRow.name,
        domain: storeRow.domain,
        active: storeRow.active
      }
    }
  }

  async findById(id: string, storeId?: string): Promise<User | null> {
    const conditions = [eq(schema.users.id, id)]
    if (storeId) {
      conditions.push(eq(schema.users.store_id, storeId))
    }

    const result = await db
      .select()
      .from(schema.users)
      .where(and(...conditions))
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
      password_hash: row.password_hash,
      role: row.role as User['role'],
      created_at: row.created_at
    }
  }

  async findByIdWithStore(id: string): Promise<UserWithStore | null> {
    const result = await db
      .select({
        id: schema.users.id,
        store_id: schema.users.store_id,
        name: schema.users.name,
        email: schema.users.email,
        password_hash: schema.users.password_hash,
        role: schema.users.role,
        created_at: schema.users.created_at,
        store: {
          id: schema.stores.id,
          name: schema.stores.name,
          domain: schema.stores.domain,
          active: schema.stores.active
        }
      })
      .from(schema.users)
      .leftJoin(schema.stores, eq(schema.users.store_id, schema.stores.id))
      .where(eq(schema.users.id, id))
      .limit(1)

    if (result.length === 0) {
      return null
    }

    const row = result[0]

    if (!row.store_id || !row.store?.id) {
      return {
        id: row.id,
        store_id: null,
        name: row.name,
        email: row.email,
        password_hash: row.password_hash,
        role: row.role as User['role'],
        created_at: row.created_at,
        store: null
      }
    }

    return {
      id: row.id,
      store_id: row.store_id,
      name: row.name,
      email: row.email,
      password_hash: row.password_hash,
      role: row.role as User['role'],
      created_at: row.created_at,
      store: row.store
    }
  }

  async listByStore(storeId: string): Promise<User[]> {
    const result = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.store_id, storeId))

    return result.map((row) => ({
      id: row.id,
      store_id: row.store_id,
      name: row.name,
      email: row.email,
      password_hash: row.password_hash,
      role: row.role as User['role'],
      created_at: row.created_at
    }))
  }

  async listVendorsByStore(storeId: string): Promise<Omit<User, 'password_hash'>[]> {
    const result = await db
      .select({
        id: schema.users.id,
        store_id: schema.users.store_id,
        name: schema.users.name,
        email: schema.users.email,
        role: schema.users.role,
        created_at: schema.users.created_at
      })
      .from(schema.users)
      .where(
        and(
          eq(schema.users.store_id, storeId),
          eq(schema.users.role, 'vendedor')
        )
      )

    return result.map((row) => ({
      id: row.id,
      store_id: row.store_id,
      name: row.name,
      email: row.email,
      role: row.role as User['role'],
      created_at: row.created_at
    }))
  }

  async create(data: CreateUserInput): Promise<User> {
    const passwordHash = await bcrypt.hash(data.password, 10)

    const result = await db
      .insert(schema.users)
      .values({
        store_id: data.store_id,
        name: data.name,
        email: data.email,
        password_hash: passwordHash,
        role: data.role
      })
      .returning()

    const row = result[0]
    return {
      id: row.id,
      store_id: row.store_id,
      name: row.name,
      email: row.email,
      password_hash: row.password_hash,
      role: row.role as User['role'],
      created_at: row.created_at
    }
  }

  async update(
    id: string,
    storeId: string,
    data: Partial<{ name: string; email: string; role: 'admin' | 'operador' | 'vendedor' }>
  ): Promise<User> {
    const result = await db
      .update(schema.users)
      .set(data)
      .where(and(eq(schema.users.id, id), eq(schema.users.store_id, storeId)))
      .returning()

    if (result.length === 0) {
      throw new Error('User not found')
    }

    const row = result[0]
    return {
      id: row.id,
      store_id: row.store_id,
      name: row.name,
      email: row.email,
      password_hash: row.password_hash,
      role: row.role as User['role'],
      created_at: row.created_at
    }
  }

  async delete(id: string, storeId: string): Promise<void> {
    await db
      .delete(schema.users)
      .where(and(eq(schema.users.id, id), eq(schema.users.store_id, storeId)))
  }

  async updatePassword(id: string, storeId: string, passwordHash: string): Promise<void> {
    const result = await db
      .update(schema.users)
      .set({ password_hash: passwordHash })
      .where(and(eq(schema.users.id, id), eq(schema.users.store_id, storeId)))
      .returning()

    if (result.length === 0) {
      throw new Error('User not found')
    }
  }
}

