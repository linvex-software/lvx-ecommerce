import { db, schema } from '@white-label/db'
import { eq, and, isNull, desc, sql } from 'drizzle-orm'

const MAX_SESSIONS_PER_USER = 5

export interface AuthSession {
  id: string
  user_id: string | null
  customer_id: string | null
  store_id: string
  refresh_token: string
  user_agent: string | null
  ip_address: string | null
  expires_at: Date
  created_at: Date
  revoked_at: Date | null
}

export interface CreateSessionInput {
  user_id?: string
  customer_id?: string
  store_id: string
  refresh_token: string
  user_agent?: string
  ip_address?: string
  expires_at: Date
}

export interface CreateCustomerSessionInput {
  customer_id: string
  store_id: string
  refresh_token: string
  user_agent?: string
  ip_address?: string
  expires_at: Date
}

export class AuthSessionRepository {
  async createSession(data: CreateSessionInput): Promise<void> {
    if (data.user_id) {
      const activeCount = await this.countActiveSessionsByUser(data.user_id)

      if (activeCount >= MAX_SESSIONS_PER_USER) {
        await this.revokeOldestSession(data.user_id)
      }
    } else if (data.customer_id) {
      const activeCount = await this.countActiveSessionsByCustomer(data.customer_id)

      if (activeCount >= MAX_SESSIONS_PER_USER) {
        await this.revokeOldestSessionByCustomer(data.customer_id)
      }
    }

    await db.insert(schema.authSessions).values({
      user_id: data.user_id ?? null,
      customer_id: data.customer_id ?? null,
      store_id: data.store_id,
      refresh_token: data.refresh_token,
      user_agent: data.user_agent ?? null,
      ip_address: data.ip_address ?? null,
      expires_at: data.expires_at
    })
  }

  async createCustomerSession(data: CreateCustomerSessionInput): Promise<void> {
    const activeCount = await this.countActiveSessionsByCustomer(data.customer_id)

    if (activeCount >= MAX_SESSIONS_PER_USER) {
      await this.revokeOldestSessionByCustomer(data.customer_id)
    }

    await db.insert(schema.authSessions).values({
      customer_id: data.customer_id,
      store_id: data.store_id,
      refresh_token: data.refresh_token,
      user_agent: data.user_agent ?? null,
      ip_address: data.ip_address ?? null,
      expires_at: data.expires_at
    })
  }

  async findByToken(refreshToken: string): Promise<AuthSession | null> {
    const result = await db
      .select()
      .from(schema.authSessions)
      .where(eq(schema.authSessions.refresh_token, refreshToken))
      .limit(1)

    if (result.length === 0) {
      return null
    }

    const row = result[0]
    return {
      id: row.id,
      user_id: row.user_id,
      customer_id: row.customer_id,
      store_id: row.store_id,
      refresh_token: row.refresh_token,
      user_agent: row.user_agent,
      ip_address: row.ip_address,
      expires_at: row.expires_at,
      created_at: row.created_at,
      revoked_at: row.revoked_at
    }
  }

  async revokeById(id: string): Promise<void> {
    await db
      .update(schema.authSessions)
      .set({ revoked_at: new Date() })
      .where(eq(schema.authSessions.id, id))
  }

  async revokeAllByUser(userId: string): Promise<void> {
    await db
      .update(schema.authSessions)
      .set({ revoked_at: new Date() })
      .where(
        and(
          eq(schema.authSessions.user_id, userId),
          isNull(schema.authSessions.revoked_at)
        )
      )
  }

  async countActiveSessionsByUser(userId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.authSessions)
      .where(
        and(
          eq(schema.authSessions.user_id, userId),
          isNull(schema.authSessions.revoked_at),
          sql`${schema.authSessions.expires_at} > NOW()`
        )
      )

    return Number(result[0]?.count ?? 0)
  }

  private async revokeOldestSession(userId: string): Promise<void> {
    const oldestSession = await db
      .select()
      .from(schema.authSessions)
      .where(
        and(
          eq(schema.authSessions.user_id, userId),
          isNull(schema.authSessions.revoked_at)
        )
      )
      .orderBy(desc(schema.authSessions.created_at))
      .limit(1)

    if (oldestSession.length > 0) {
      await this.revokeById(oldestSession[0].id)
    }
  }

  async countActiveSessionsByCustomer(customerId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.authSessions)
      .where(
        and(
          eq(schema.authSessions.customer_id, customerId),
          isNull(schema.authSessions.revoked_at),
          sql`${schema.authSessions.expires_at} > NOW()`
        )
      )

    return Number(result[0]?.count ?? 0)
  }

  async revokeAllByCustomer(customerId: string): Promise<void> {
    await db
      .update(schema.authSessions)
      .set({ revoked_at: new Date() })
      .where(
        and(
          eq(schema.authSessions.customer_id, customerId),
          isNull(schema.authSessions.revoked_at)
        )
      )
  }

  private async revokeOldestSessionByCustomer(customerId: string): Promise<void> {
    const oldestSession = await db
      .select()
      .from(schema.authSessions)
      .where(
        and(
          eq(schema.authSessions.customer_id, customerId),
          isNull(schema.authSessions.revoked_at)
        )
      )
      .orderBy(desc(schema.authSessions.created_at))
      .limit(1)

    if (oldestSession.length > 0) {
      await this.revokeById(oldestSession[0].id)
    }
  }
}

