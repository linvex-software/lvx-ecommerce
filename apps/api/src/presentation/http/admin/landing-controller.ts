import type { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { LandingRepository } from '../../../infra/db/repositories/landing-repository'
import type {
  CreateDynamicPageInput,
  UpdateDynamicPageInput,
  SetPageProductsInput
} from '../../../domain/landing/landing-types'

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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      const errorStack = error instanceof Error ? error.stack : undefined
      const errorName = error instanceof Error ? error.name : 'UnknownError'
      
      // Log detalhado do erro
      console.error('[LandingController.list] Error listing dynamic pages:', {
        name: errorName,
        message: errorMessage,
        stack: errorStack,
        storeId: request.storeId,
        userId: request.user?.id,
        userStoreId: (request.user as any)?.storeId,
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error
      })
      
      // Tentar enviar resposta de erro
      try {
        return reply.status(500).send({ 
          error: 'Failed to list dynamic pages',
          message: process.env.NODE_ENV === 'production' 
            ? 'An error occurred while listing pages' 
            : errorMessage,
          ...(process.env.NODE_ENV !== 'production' && errorStack ? { stack: errorStack } : {})
        })
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

