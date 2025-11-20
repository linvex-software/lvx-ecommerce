import type { FastifyRequest, FastifyReply } from 'fastify'
import { db, schema } from '@white-label/db'
import { eq } from 'drizzle-orm'

export async function tenantMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const storeIdHeader = request.headers['x-store-id'] as string | undefined

  if (storeIdHeader) {
    const store = await db
      .select()
      .from(schema.stores)
      .where(eq(schema.stores.id, storeIdHeader))
      .limit(1)

    if (store.length === 0 || !store[0].active) {
      await reply.code(404).send({ error: 'Store not found' })
      return
    }

    request.storeId = storeIdHeader
    return
  }

  const hostname = request.hostname
  const store = await db
    .select()
    .from(schema.stores)
    .where(eq(schema.stores.domain, hostname))
    .limit(1)

  if (store.length === 0 || !store[0].active) {
    await reply.code(404).send({ error: 'Store not found' })
    return
  }

  request.storeId = store[0].id
}

