import type { FastifyRequest, FastifyReply } from 'fastify'
import { StoreLayoutRepository } from '../../../infra/db/repositories/store-layout-repository'

interface SaveLayoutBody {
  layout_json: Record<string, unknown>
}

/**
 * Sanitiza um objeto removendo valores não serializáveis (funções, undefined, etc)
 * e garante que o resultado seja um JSON válido
 */
function sanitizeJson(obj: unknown): Record<string, unknown> {
  if (obj === null || obj === undefined) {
    return {}
  }

  // Se já é um objeto simples, retornar como está
  if (typeof obj === 'object' && !Array.isArray(obj)) {
    const sanitized: Record<string, unknown> = {}
    
    for (const [key, value] of Object.entries(obj)) {
      // Ignorar funções, undefined, símbolos
      if (typeof value === 'function' || value === undefined) {
        continue
      }
      
      // Recursivamente sanitizar objetos aninhados
      if (typeof value === 'object' && value !== null) {
        if (Array.isArray(value)) {
          sanitized[key] = value.map(item => 
            typeof item === 'object' && item !== null 
              ? sanitizeJson(item) 
              : item
          )
        } else {
          sanitized[key] = sanitizeJson(value)
        }
      } else {
        sanitized[key] = value
      }
    }
    
    return sanitized
  }

  // Para arrays ou primitivos, retornar objeto vazio ou converter
  if (Array.isArray(obj)) {
    return { data: obj.map(item => 
      typeof item === 'object' && item !== null 
        ? sanitizeJson(item) 
        : item
    ) }
  }

  return {}
}

export class EditorController {
  constructor(private storeLayoutRepository: StoreLayoutRepository) {}

  async getLayout(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    try {
      if (!request.user?.storeId) {
        await reply.code(401).send({ error: 'Unauthorized' })
        return
      }

      const layout = await this.storeLayoutRepository.findByStoreId(
        request.user.storeId
      )

      // Retornar null se não houver layout (não é erro)
      if (!layout) {
        await reply.send({
          layout_json: null,
          updated_at: null
        })
        return
      }

      await reply.send({
        layout_json: layout.layout_json,
        updated_at: layout.updated_at
      })
    } catch (error) {
      request.log.error(error, 'Error getting layout')
      await reply.code(500).send({ error: 'Internal server error' })
    }
  }

  async getLayoutPublic(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    try {
      // storeId vem do tenantMiddleware via request.storeId
      const storeId = (request as any).storeId

      if (!storeId) {
        await reply.code(400).send({ error: 'Store ID is required' })
        return
      }

      const layout = await this.storeLayoutRepository.findByStoreId(storeId)

      if (!layout) {
        await reply.code(404).send({ error: 'Layout not found' })
        return
      }

      await reply.send({
        layout_json: layout.layout_json,
        updated_at: layout.updated_at
      })
    } catch (error) {
      request.log.error(error, 'Error getting layout')
      await reply.code(500).send({ error: 'Internal server error' })
    }
  }

  async saveLayout(
    request: FastifyRequest<{ Body: SaveLayoutBody }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      if (!request.user?.storeId) {
        await reply.code(401).send({ error: 'Unauthorized' })
        return
      }

      const { layout_json } = request.body

      if (!layout_json) {
        await reply.code(400).send({ error: 'layout_json is required' })
        return
      }

      // Validar que layout_json é um objeto válido
      if (typeof layout_json !== 'object' || layout_json === null || Array.isArray(layout_json)) {
        await reply.code(400).send({ error: 'layout_json must be an object' })
        return
      }

      // Sanitizar o JSON para remover valores não serializáveis
      const sanitizedLayout = sanitizeJson(layout_json)

      // Tentar serializar para garantir que é JSON válido
      try {
        JSON.stringify(sanitizedLayout)
      } catch (jsonError) {
        request.log.error(jsonError, 'Invalid JSON in layout_json after sanitization')
        await reply.code(400).send({ error: 'layout_json contains invalid JSON' })
        return
      }

      const layout = await this.storeLayoutRepository.upsert({
        store_id: request.user.storeId,
        layout_json: sanitizedLayout
      })

      await reply.send({
        success: true,
        layout_json: layout.layout_json,
        updated_at: layout.updated_at
      })
    } catch (error) {
      request.log.error(
        {
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          storeId: request.user?.storeId
        },
        'Error saving layout'
      )
      
      const errorMessage = error instanceof Error ? error.message : 'Internal server error'
      await reply.code(500).send({ 
        error: 'Internal server error',
        message: errorMessage
      })
    }
  }
}

