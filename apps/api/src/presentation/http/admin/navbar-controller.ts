import type { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { NavbarRepository } from '../../../infra/db/repositories/navbar-repository'
import type {
  CreateNavbarItemInput,
  UpdateNavbarItemInput
} from '../../../domain/navbar/navbar-types'

const createNavbarItemSchema = z.object({
  label: z.string().min(1).max(100),
  type: z.enum(['internal', 'external', 'submenu']),
  url: z.string().optional(),
  target: z.enum(['_self', '_blank']).optional(),
  icon: z.string().optional(),
  visible: z.boolean().optional(),
  order: z.number().int().optional(),
  parentId: z.string().uuid().nullable().optional(),
  style: z
    .object({
      color: z.string().optional(),
      hoverColor: z.string().optional(),
      fontSize: z.string().optional(),
      fontWeight: z.string().optional(),
      padding: z.string().optional(),
      margin: z.string().optional(),
      border: z.string().optional(),
      borderRadius: z.string().optional(),
      responsive: z
        .object({
          desktop: z.record(z.unknown()).optional(),
          mobile: z.record(z.unknown()).optional(),
        })
        .optional(),
    })
    .optional()
    .nullable(),
})

const updateNavbarItemSchema = createNavbarItemSchema.partial()

const updateOrderSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().uuid(),
      order: z.number().int(),
    })
  ),
})

export class NavbarController {
  constructor(private readonly navbarRepository: NavbarRepository) {}

  /**
   * GET /admin/navbar - Listar todos os itens
   */
  async list(request: FastifyRequest, reply: FastifyReply) {
    try {
      const storeId = (request as any).storeId as string

      const items = await this.navbarRepository.findByStoreId(storeId)

      return reply.status(200).send({ navbar_items: items })
    } catch (error) {
      console.error('Error listing navbar items:', error)
      return reply.status(500).send({ error: 'Failed to list navbar items' })
    }
  }

  /**
   * GET /admin/navbar/:id - Buscar item por ID
   */
  async get(request: FastifyRequest, reply: FastifyReply) {
    try {
      const storeId = (request as any).storeId as string
      const { id } = request.params as { id: string }

      const item = await this.navbarRepository.findById(id, storeId)

      if (!item) {
        return reply.status(404).send({ error: 'Navbar item not found' })
      }

      return reply.status(200).send({ navbar_item: item })
    } catch (error) {
      console.error('Error getting navbar item:', error)
      return reply.status(500).send({ error: 'Failed to get navbar item' })
    }
  }

  /**
   * POST /admin/navbar - Criar novo item
   */
  async create(request: FastifyRequest, reply: FastifyReply) {
    try {
      const storeId = (request as any).storeId as string
      const body = createNavbarItemSchema.parse(request.body)

      // Validações adicionais
      if (body.type !== 'submenu' && !body.url) {
        return reply
          .status(400)
          .send({ error: 'URL is required for internal and external items' })
      }

      // Sanitizar label
      const sanitizedLabel = this.sanitizeLabel(body.label)

      const input: CreateNavbarItemInput = {
        ...body,
        label: sanitizedLabel,
      }

      const item = await this.navbarRepository.create(storeId, input)

      return reply.status(201).send({ navbar_item: item })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Validation error', details: error.errors })
      }
      console.error('Error creating navbar item:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return reply.status(500).send({ 
        error: 'Failed to create navbar item',
        details: errorMessage 
      })
    }
  }

  /**
   * PUT /admin/navbar/:id - Atualizar item
   */
  async update(request: FastifyRequest, reply: FastifyReply) {
    try {
      const storeId = (request as any).storeId as string
      const { id } = request.params as { id: string }
      const body = updateNavbarItemSchema.parse(request.body)

      // Verificar se item existe
      const existing = await this.navbarRepository.findById(id, storeId)
      if (!existing) {
        return reply.status(404).send({ error: 'Navbar item not found' })
      }

      // Sanitizar label se fornecido
      const input: UpdateNavbarItemInput = body
      if (body.label) {
        input.label = this.sanitizeLabel(body.label)
      }

      // Validar URL se tipo mudou
      if (body.type && body.type !== 'submenu' && !body.url && !existing.url) {
        return reply
          .status(400)
          .send({ error: 'URL is required for internal and external items' })
      }

      const item = await this.navbarRepository.update(id, storeId, input)

      return reply.status(200).send({ navbar_item: item })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Validation error', details: error.errors })
      }
      console.error('Error updating navbar item:', error)
      return reply.status(500).send({ error: 'Failed to update navbar item' })
    }
  }

  /**
   * DELETE /admin/navbar/:id - Deletar item
   */
  async delete(request: FastifyRequest, reply: FastifyReply) {
    try {
      const storeId = (request as any).storeId as string
      const { id } = request.params as { id: string }

      await this.navbarRepository.delete(id, storeId)

      return reply.status(204).send()
    } catch (error) {
      console.error('Error deleting navbar item:', error)
      return reply.status(500).send({ error: 'Failed to delete navbar item' })
    }
  }

  /**
   * PUT /admin/navbar/order - Atualizar ordem de múltiplos itens
   */
  async updateOrder(request: FastifyRequest, reply: FastifyReply) {
    try {
      const storeId = (request as any).storeId as string
      const body = updateOrderSchema.parse(request.body)

      await this.navbarRepository.updateOrder(storeId, body.items)

      return reply.status(200).send({ success: true })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Validation error', details: error.errors })
      }
      console.error('Error updating navbar order:', error)
      return reply.status(500).send({ error: 'Failed to update navbar order' })
    }
  }

  /**
   * Sanitizar label (remover HTML e JS)
   */
  private sanitizeLabel(label: string): string {
    // Remover tags HTML
    let sanitized = label.replace(/<[^>]*>/g, '')
    // Remover scripts
    sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remover event handlers
    sanitized = sanitized.replace(/on\w+="[^"]*"/gi, '')
    // Limitar tamanho
    return sanitized.trim().slice(0, 100)
  }
}

