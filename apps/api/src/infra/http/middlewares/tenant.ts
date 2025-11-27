import type { FastifyRequest, FastifyReply } from 'fastify'
import { db, schema } from '@white-label/db'
import { eq } from 'drizzle-orm'

export async function tenantMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  // Primeiro, tentar pegar storeId do token JWT (se usuário estiver autenticado)
  const user = request.user as { storeId?: string } | undefined
  if (user?.storeId) {
    const store = await db
      .select()
      .from(schema.stores)
      .where(eq(schema.stores.id, user.storeId))
      .limit(1)

    if (store.length === 0 || !store[0].active) {
      await reply.code(404).send({ error: 'Store not found' })
      return
    }

    request.storeId = user.storeId
    return
  }

  // Se usuário está autenticado mas não tem store, não retornar erro aqui
  // Deixa que a rota específica decida se precisa de store ou não
  if (user) {
    // Usuário autenticado sem store - não definir request.storeId
    // Isso permite que rotas como /stores (criar store) funcionem
    return
  }

  // Se não tiver no JWT, tentar header x-store-id (para rotas públicas)
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

  // Se não encontrou store por nenhum método, retornar erro
  await reply.code(404).send({ 
    error: 'Store not found',
    message: 'Store ID não fornecido. É necessário enviar o header x-store-id ou estar autenticado com um token que contenha storeId.'
  })
}

