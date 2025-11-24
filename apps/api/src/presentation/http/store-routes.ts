import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { db, schema } from '@white-label/db'
import { eq } from 'drizzle-orm'

export async function registerStoreRoutes(app: FastifyInstance): Promise<void> {
  // Endpoint público para buscar storeId por domain (usado pelo admin no login)
  app.get<{
    Querystring: {
      domain?: string
    }
  }>(
    '/stores/by-domain',
    async (
      request: FastifyRequest<{
        Querystring: {
          domain?: string
        }
      }>,
      reply: FastifyReply
    ) => {
      try {
        const domain = request.query.domain || 'localhost'

        const stores = await db
          .select({
            id: schema.stores.id,
            name: schema.stores.name,
            active: schema.stores.active
          })
          .from(schema.stores)
          .where(eq(schema.stores.domain, domain))
          .limit(1)

        if (stores.length === 0) {
          await reply.code(404).send({
            error: 'Store not found',
            message: `Nenhuma loja encontrada com domain: ${domain}`
          })
          return
        }

        const store = stores[0]

        if (!store.active) {
          await reply.code(404).send({
            error: 'Store not found',
            message: 'Loja encontrada mas está inativa'
          })
          return
        }

        await reply.send({
          storeId: store.id,
          name: store.name,
          domain: domain
        })
      } catch (error) {
        request.log.error(error)
        await reply.code(500).send({ error: 'Internal server error' })
      }
    }
  )
}

