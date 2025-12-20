import type { FastifyRequest, FastifyReply } from 'fastify'
import { db, schema } from '@white-label/db'
import { eq } from 'drizzle-orm'

export async function tenantMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    // Primeiro, tentar pegar storeId do token JWT (se usuário estiver autenticado)
    const user = request.user as { storeId?: string } | undefined
    
    console.log('[tenantMiddleware] Verificando storeId', {
      hasUser: !!user,
      userStoreId: user?.storeId,
      userId: user ? (user as any).id : undefined,
      path: request.url
    })

    if (user?.storeId) {
      try {
        const store = await db
          .select()
          .from(schema.stores)
          .where(eq(schema.stores.id, user.storeId))
          .limit(1)

        if (store.length === 0 || !store[0].active) {
          console.error('[tenantMiddleware] Store não encontrada ou inativa', {
            storeId: user.storeId,
            found: store.length > 0,
            active: store[0]?.active
          })
          await reply.code(404).send({ error: 'Store not found' })
          return
        }

        request.storeId = user.storeId
        console.log('[tenantMiddleware] storeId definido do JWT:', user.storeId)
        return
      } catch (dbError) {
        console.error('[tenantMiddleware] Erro ao buscar store no banco:', {
          storeId: user.storeId,
          error: dbError instanceof Error ? dbError.message : 'Unknown error',
          stack: dbError instanceof Error ? dbError.stack : undefined
        })
        await reply.code(500).send({ error: 'Internal server error' })
        return
      }
    }

    // Se usuário está autenticado mas não tem store, não retornar erro aqui
    // Deixa que a rota específica decida se precisa de store ou não
    if (user) {
      console.log('[tenantMiddleware] Usuário autenticado sem storeId - permitindo continuar (rota pode não precisar de store)')
      // Usuário autenticado sem store - não definir request.storeId
      // Isso permite que rotas como /stores (criar store) funcionem
      return
    }

    // Se não tiver no JWT, tentar header x-store-id (para rotas públicas)
    const storeIdHeader = request.headers['x-store-id'] as string | undefined
    if (storeIdHeader) {
      try {
        const store = await db
          .select()
          .from(schema.stores)
          .where(eq(schema.stores.id, storeIdHeader))
          .limit(1)

        if (store.length === 0 || !store[0].active) {
          console.error('[tenantMiddleware] Store do header não encontrada ou inativa', {
            storeId: storeIdHeader,
            found: store.length > 0,
            active: store[0]?.active
          })
          await reply.code(404).send({ error: 'Store not found' })
          return
        }

        request.storeId = storeIdHeader
        console.log('[tenantMiddleware] storeId definido do header:', storeIdHeader)
        return
      } catch (dbError) {
        console.error('[tenantMiddleware] Erro ao buscar store do header no banco:', {
          storeId: storeIdHeader,
          error: dbError instanceof Error ? dbError.message : 'Unknown error',
          stack: dbError instanceof Error ? dbError.stack : undefined
        })
        await reply.code(500).send({ error: 'Internal server error' })
        return
      }
    }

    // Se não encontrou store por nenhum método, retornar erro
    console.error('[tenantMiddleware] Store ID não encontrado por nenhum método', {
      hasUser: !!user,
      userStoreId: user?.storeId,
      hasStoreIdHeader: !!storeIdHeader,
      path: request.url
    })
    await reply.code(404).send({ 
      error: 'Store not found',
      message: 'Store ID não fornecido. É necessário enviar o header x-store-id ou estar autenticado com um token que contenha storeId.'
    })
  } catch (error) {
    console.error('[tenantMiddleware] Erro inesperado:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    await reply.code(500).send({ error: 'Internal server error' })
  }
}

