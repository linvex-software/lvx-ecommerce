import type { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { LandingRepository } from '../../../infra/db/repositories/landing-repository'
import type {
  CreateDynamicPageInput,
  UpdateDynamicPageInput,
  SetPageProductsInput
} from '../../../domain/landing/landing-types'

/**
 * Analisa um erro e retorna uma mensagem específica baseada no tipo de erro
 * Sempre retorna código de erro e mensagem descritiva, mesmo em produção
 */
function getErrorMessage(error: unknown): { message: string; code: string; details?: unknown } {
  if (!(error instanceof Error)) {
    return { 
      message: 'Erro desconhecido ao processar a requisição',
      code: 'UNKNOWN_ERROR'
    }
  }

  const errorName = error.name
  const errorMessage = error.message.toLowerCase()
  const fullMessage = error.message

  // Erros de conexão com banco de dados (PostgreSQL/Drizzle)
  if (
    errorName === 'ConnectionError' ||
    errorName === 'ConnectionRefusedError' ||
    errorMessage.includes('connection') ||
    errorMessage.includes('connect econnrefused') ||
    errorMessage.includes('getaddrinfo') ||
    errorMessage.includes('connection refused') ||
    errorMessage.includes('connection timeout') ||
    errorMessage.includes('connect timeout')
  ) {
    return {
      message: 'Erro de conexão com o banco de dados. Tente novamente em alguns instantes.',
      code: 'DATABASE_CONNECTION_ERROR',
      details: {
        hint: 'Verifique se o banco de dados está acessível',
        ...(process.env.NODE_ENV !== 'production' ? { original: fullMessage } : {})
      }
    }
  }

  // Erros de query SQL (PostgreSQL/Drizzle)
  if (
    errorName === 'QueryError' ||
    errorName === 'DatabaseError' ||
    errorName === 'PostgresError' ||
    errorMessage.includes('syntax error') ||
    errorMessage.includes('invalid') ||
    errorMessage.includes('column') ||
    errorMessage.includes('table') ||
    errorMessage.includes('relation') ||
    errorMessage.includes('does not exist') ||
    errorMessage.includes('duplicate key') ||
    errorMessage.includes('unique constraint')
  ) {
    return {
      message: 'Erro ao consultar o banco de dados. Verifique os logs do servidor para mais detalhes.',
      code: 'DATABASE_QUERY_ERROR',
      details: {
        hint: 'Pode ser um problema com a estrutura do banco de dados ou query inválida',
        ...(process.env.NODE_ENV !== 'production' ? { original: fullMessage } : {})
      }
    }
  }

  // Erros de serialização/JSON
  if (
    errorMessage.includes('serialize') ||
    errorMessage.includes('json') ||
    errorMessage.includes('circular') ||
    errorMessage.includes('invalid date') ||
    errorMessage.includes('toisostring') ||
    errorMessage.includes('cannot convert') ||
    errorMessage.includes('date parsing')
  ) {
    return {
      message: 'Erro ao processar os dados. Algum campo pode estar em formato inválido.',
      code: 'SERIALIZATION_ERROR',
      details: {
        hint: 'Verifique se os campos de data estão no formato correto',
        ...(process.env.NODE_ENV !== 'production' ? { original: fullMessage } : {})
      }
    }
  }

  // Erros de validação
  if (errorName === 'ValidationError' || errorMessage.includes('validation') || errorMessage.includes('zod')) {
    return {
      message: 'Erro de validação nos dados fornecidos.',
      code: 'VALIDATION_ERROR',
      details: {
        hint: 'Os dados enviados não atendem aos requisitos esperados',
        ...(process.env.NODE_ENV !== 'production' ? { original: fullMessage } : {})
      }
    }
  }

  // Erros de permissão/acesso
  if (
    errorName === 'UnauthorizedError' ||
    errorMessage.includes('unauthorized') ||
    errorMessage.includes('permission') ||
    errorMessage.includes('access denied') ||
    errorMessage.includes('forbidden')
  ) {
    return {
      message: 'Você não tem permissão para realizar esta ação.',
      code: 'UNAUTHORIZED_ERROR',
      details: {
        hint: 'Verifique se você está autenticado e tem as permissões necessárias',
        ...(process.env.NODE_ENV !== 'production' ? { original: fullMessage } : {})
      }
    }
  }

  // Erros de timeout
  if (errorName === 'TimeoutError' || errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
    return {
      message: 'A operação demorou muito para ser concluída. Tente novamente.',
      code: 'TIMEOUT_ERROR',
      details: {
        hint: 'A requisição excedeu o tempo limite. Tente novamente ou reduza a quantidade de dados.',
        ...(process.env.NODE_ENV !== 'production' ? { original: fullMessage } : {})
      }
    }
  }

  // Erros de memória
  if (errorName === 'RangeError' || errorMessage.includes('memory') || errorMessage.includes('heap') || errorMessage.includes('out of memory')) {
    return {
      message: 'Erro ao processar dados muito grandes. Tente reduzir a quantidade de dados.',
      code: 'MEMORY_ERROR',
      details: {
        hint: 'A operação requer mais memória do que está disponível',
        ...(process.env.NODE_ENV !== 'production' ? { original: fullMessage } : {})
      }
    }
  }

  // Erros específicos do Drizzle ORM
  if (errorMessage.includes('drizzle') || errorMessage.includes('orm')) {
    return {
      message: 'Erro no ORM ao processar a requisição. Verifique os logs do servidor.',
      code: 'ORM_ERROR',
      details: {
        hint: 'Pode ser um problema com o mapeamento de dados ou query do ORM',
        ...(process.env.NODE_ENV !== 'production' ? { original: fullMessage, name: errorName } : {})
      }
    }
  }

  // Erro genérico - sempre retornar código e mensagem útil
  return {
    message: `Erro ao processar a requisição: ${errorName || 'Erro desconhecido'}`,
    code: 'INTERNAL_ERROR',
    details: {
      hint: 'Verifique os logs do servidor para mais detalhes',
      errorType: errorName,
      ...(process.env.NODE_ENV !== 'production' ? { 
        original: fullMessage,
        stack: error.stack 
      } : {})
    }
  }
}

const createDynamicPageSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/, 'Slug deve conter apenas letras minúsculas, números e hífens'),
  published: z.boolean().optional(),
  contentJson: z.record(z.unknown()).optional().nullable(),
})

const updateDynamicPageSchema = createDynamicPageSchema.partial()

const setPageProductsSchema = z.object({
  productIds: z.array(z.string().uuid()),
})

export class LandingController {
  constructor(private readonly landingRepository: LandingRepository) {}

  /**
   * POST /admin/dynamic-pages - Criar nova página dinâmica
   */
  async create(request: FastifyRequest, reply: FastifyReply) {
    try {
      const storeId = (request as any).storeId as string
      const body = createDynamicPageSchema.parse(request.body)

      // Verificar se slug já existe
      const existing = await this.landingRepository.findBySlug(body.slug, storeId)
      if (existing) {
        return reply.status(400).send({ error: 'Slug já existe para esta loja' })
      }

      const input: CreateDynamicPageInput = {
        title: body.title,
        slug: body.slug,
        published: body.published ?? false,
        contentJson: body.contentJson || null,
      }

      const page = await this.landingRepository.createDynamicPage(storeId, input)

      return reply.status(201).send({ page })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Validation error', details: error.errors })
      }
      console.error('Error creating dynamic page:', error)
      return reply.status(500).send({ error: 'Failed to create dynamic page' })
    }
  }

  /**
   * GET /admin/dynamic-pages - Listar todas as páginas dinâmicas
   */
  async list(request: FastifyRequest, reply: FastifyReply) {
    // Log inicial para debug
    console.log('[LandingController.list] Iniciando listagem de páginas', {
      storeId: request.storeId,
      userId: request.user?.id,
      userStoreId: (request.user as any)?.storeId,
      hasAuth: !!request.headers.authorization
    })

    try {
      const storeId = request.storeId

      if (!storeId) {
        const errorDetails = {
          user: request.user,
          userStoreId: (request.user as any)?.storeId,
          headers: {
            authorization: request.headers.authorization ? 'present' : 'missing',
            'x-store-id': request.headers['x-store-id'] || 'missing'
          }
        }
        console.error('[LandingController.list] storeId não encontrado na requisição', errorDetails)
        return reply.status(400).send({ 
          error: 'Store ID is required',
          message: 'Store ID não foi fornecido. Verifique se o tenantMiddleware foi executado corretamente.',
          details: process.env.NODE_ENV !== 'production' ? errorDetails : undefined
        })
      }

      console.log('[LandingController.list] Buscando páginas para storeId:', storeId)
      const pages = await this.landingRepository.listByStore(storeId)
      console.log('[LandingController.list] Páginas encontradas:', pages.length)

      // Serializar datas para ISO strings para garantir compatibilidade JSON
      let serializedPages
      try {
        serializedPages = pages.map((page, index) => {
          try {
            return {
              id: page.id,
              storeId: page.storeId,
              title: page.title,
              slug: page.slug,
              published: page.published,
              contentJson: page.contentJson,
              createdAt: page.createdAt instanceof Date 
                ? page.createdAt.toISOString() 
                : typeof page.createdAt === 'string' 
                  ? page.createdAt 
                  : new Date(page.createdAt as any).toISOString(),
              updatedAt: page.updatedAt instanceof Date 
                ? page.updatedAt.toISOString() 
                : typeof page.updatedAt === 'string' 
                  ? page.updatedAt 
                  : new Date(page.updatedAt as any).toISOString(),
            }
          } catch (serializeError) {
            console.error(`[LandingController.list] Erro ao serializar página ${index}:`, {
              pageId: page.id,
              error: serializeError instanceof Error ? serializeError.message : 'Unknown error',
              pageData: page
            })
            throw serializeError
          }
        })
      } catch (serializeError) {
        console.error('[LandingController.list] Erro ao serializar páginas:', serializeError)
        throw new Error(`Failed to serialize pages: ${serializeError instanceof Error ? serializeError.message : 'Unknown error'}`)
      }

      console.log('[LandingController.list] Retornando resposta com', serializedPages.length, 'páginas')
      return reply.status(200).send({ pages: serializedPages })
    } catch (error) {
      const errorInfo = getErrorMessage(error)
      const errorStack = error instanceof Error ? error.stack : undefined
      const errorName = error instanceof Error ? error.name : 'UnknownError'
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      // Log detalhado do erro
      console.error('[LandingController.list] Error listing dynamic pages:', {
        name: errorName,
        message: errorMessage,
        stack: errorStack,
        storeId: request.storeId,
        userId: request.user?.id,
        userStoreId: (request.user as any)?.storeId,
        errorCode: errorInfo.code,
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error
      })
      
      // Tentar enviar resposta de erro com mensagem específica
      // SEMPRE incluir código de erro e mensagem descritiva, mesmo em produção
      try {
        const errorResponse: {
          error: string
          message: string
          code: string
          details?: unknown
          stack?: string
        } = {
          error: 'Failed to list dynamic pages',
          message: errorInfo.message,
          code: errorInfo.code || 'INTERNAL_ERROR',
        }

        // Sempre incluir details (mas sem informações sensíveis)
        if (errorInfo.details) {
          errorResponse.details = errorInfo.details
        }

        // Stack trace apenas em desenvolvimento
        if (process.env.NODE_ENV !== 'production' && errorStack) {
          errorResponse.stack = errorStack
        }

        console.error('[LandingController.list] Enviando resposta de erro:', {
          code: errorResponse.code,
          message: errorResponse.message,
          hasDetails: !!errorResponse.details
        })

        return reply.status(500).send(errorResponse)
      } catch (replyError) {
        // Se falhar ao enviar resposta, logar o erro
        console.error('[LandingController.list] Erro ao enviar resposta de erro:', replyError)
        throw error // Re-throw o erro original
      }
    }
  }

  /**
   * GET /admin/dynamic-pages/:id - Buscar página por ID ou slug
   */
  async get(request: FastifyRequest, reply: FastifyReply) {
    try {
      const storeId = (request as any).storeId as string
      const { id } = request.params as { id: string }

      // Verificar se é um UUID válido ou um slug
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
      
      let page
      if (isUUID) {
        // Buscar por ID
        page = await this.landingRepository.findByIdWithProducts(id, storeId)
      } else {
        // Buscar por slug
        page = await this.landingRepository.findBySlugWithProducts(id, storeId)
      }

      if (!page) {
        return reply.status(404).send({ error: 'Page not found' })
      }

      return reply.status(200).send({ page })
    } catch (error) {
      console.error('Error getting dynamic page:', error)
      return reply.status(500).send({ error: 'Failed to get dynamic page' })
    }
  }

  /**
   * PUT /admin/dynamic-pages/:id - Atualizar página (por ID ou slug)
   */
  async update(request: FastifyRequest, reply: FastifyReply) {
    try {
      const storeId = (request as any).storeId as string
      const { id } = request.params as { id: string }
      const body = updateDynamicPageSchema.parse(request.body)

      // Verificar se é um UUID válido ou um slug
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
      
      // Buscar página existente para obter o ID real
      let existingPage
      if (isUUID) {
        existingPage = await this.landingRepository.findById(id, storeId)
      } else {
        existingPage = await this.landingRepository.findBySlug(id, storeId)
      }

      if (!existingPage) {
        return reply.status(404).send({ error: 'Page not found' })
      }

      const pageId = existingPage.id

      // Se estiver atualizando o slug, verificar se não existe outro com o mesmo slug
      if (body.slug) {
        const existingWithSlug = await this.landingRepository.findBySlug(body.slug, storeId)
        if (existingWithSlug && existingWithSlug.id !== pageId) {
          return reply.status(400).send({ error: 'Slug já existe para esta loja' })
        }
      }

      const input: UpdateDynamicPageInput = {
        title: body.title,
        slug: body.slug,
        published: body.published,
        contentJson: body.contentJson,
      }

      const page = await this.landingRepository.updateDynamicPage(pageId, storeId, input)

      if (!page) {
        return reply.status(404).send({ error: 'Page not found' })
      }

      return reply.status(200).send({ page })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Validation error', details: error.errors })
      }
      console.error('Error updating dynamic page:', error)
      return reply.status(500).send({ error: 'Failed to update dynamic page' })
    }
  }

  /**
   * PUT /admin/dynamic-pages/:id/content - Atualizar conteúdo Craft.js (por ID ou slug)
   */
  async updateContent(request: FastifyRequest, reply: FastifyReply) {
    try {
      const storeId = (request as any).storeId as string
      const { id } = request.params as { id: string }
      const body = z.object({
        contentJson: z.record(z.unknown()),
      }).parse(request.body)

      // Verificar se é um UUID válido ou um slug
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
      
      // Buscar página existente para obter o ID real
      let existingPage
      if (isUUID) {
        existingPage = await this.landingRepository.findById(id, storeId)
      } else {
        existingPage = await this.landingRepository.findBySlug(id, storeId)
      }

      if (!existingPage) {
        return reply.status(404).send({ error: 'Page not found' })
      }

      const page = await this.landingRepository.updateDynamicPageContent(
        existingPage.id,
        storeId,
        body.contentJson
      )

      if (!page) {
        return reply.status(404).send({ error: 'Page not found' })
      }

      return reply.status(200).send({ page })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Validation error', details: error.errors })
      }
      console.error('Error updating page content:', error)
      return reply.status(500).send({ error: 'Failed to update page content' })
    }
  }

  /**
   * PUT /admin/dynamic-pages/:id/products - Atualizar produtos da página (por ID ou slug)
   */
  async setProducts(request: FastifyRequest, reply: FastifyReply) {
    try {
      const storeId = (request as any).storeId as string
      const { id } = request.params as { id: string }
      const body = setPageProductsSchema.parse(request.body)

      // Verificar se é um UUID válido ou um slug
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
      
      // Buscar página existente para obter o ID real
      let existingPage
      if (isUUID) {
        existingPage = await this.landingRepository.findById(id, storeId)
      } else {
        existingPage = await this.landingRepository.findBySlug(id, storeId)
      }

      if (!existingPage) {
        return reply.status(404).send({ error: 'Page not found' })
      }

      const pageId = existingPage.id

      const input: SetPageProductsInput = {
        productIds: body.productIds,
      }

      await this.landingRepository.setPageProducts(pageId, storeId, input)

      // Retornar página atualizada com produtos
      const page = await this.landingRepository.findByIdWithProducts(pageId, storeId)

      return reply.status(200).send({ page })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Validation error', details: error.errors })
      }
      console.error('Error setting page products:', error)
      return reply.status(500).send({ error: 'Failed to set page products' })
    }
  }

  /**
   * DELETE /admin/dynamic-pages/:id - Deletar página (por ID ou slug)
   */
  async delete(request: FastifyRequest, reply: FastifyReply) {
    try {
      const storeId = (request as any).storeId as string
      const { id } = request.params as { id: string }

      // Verificar se é um UUID válido ou um slug
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
      
      // Buscar página existente para obter o ID real
      let existingPage
      if (isUUID) {
        existingPage = await this.landingRepository.findById(id, storeId)
      } else {
        existingPage = await this.landingRepository.findBySlug(id, storeId)
      }

      if (!existingPage) {
        return reply.status(404).send({ error: 'Page not found' })
      }

      const deleted = await this.landingRepository.delete(existingPage.id, storeId)

      if (!deleted) {
        return reply.status(404).send({ error: 'Page not found' })
      }

      return reply.status(204).send()
    } catch (error) {
      console.error('Error deleting dynamic page:', error)
      return reply.status(500).send({ error: 'Failed to delete dynamic page' })
    }
  }
}

