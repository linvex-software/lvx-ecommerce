import { db, schema } from '@white-label/db'
import { eq, and } from 'drizzle-orm'
import type { User, UserWithStore } from '../../../domain/users/user-types'

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

  async findById(id: string, storeId: string): Promise<User | null> {
    const result = await db
      .select()
      .from(schema.users)
      .where(
        and(
          eq(schema.users.id, id),
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
      created_at: row.created_at
    }
  }
}

