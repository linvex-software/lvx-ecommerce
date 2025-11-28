import type { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { saveCartUseCase, saveCartSchema } from '../../../application/carts/use-cases/save-cart'
import { getCartUseCase } from '../../../application/carts/use-cases/get-cart'
import { CartRepository } from '../../../infra/db/repositories/cart-repository'

export class CartController {
  constructor(private readonly cartRepository: CartRepository) {}

  async saveCart(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const storeId = request.storeId
      if (!storeId) {
        await reply.code(400).send({ error: 'Store ID is required' })
        return
      }

      // Extrair session_id e customer_id do body
      const body = request.body as any
      const sessionId = body.session_id
      const customerId = body.customer_id // Por enquanto vem do body, pode vir de auth no futuro

      const validated = saveCartSchema.parse({
        ...body,
        customer_id: customerId,
        session_id: sessionId
      })

      const cart = await saveCartUseCase(validated, storeId, {
        cartRepository: this.cartRepository
      })

      await reply.code(200).send({ cart })
    } catch (error) {
      if (error instanceof z.ZodError) {
        await reply.code(400).send({
          error: 'Validation error',
          details: error.errors
        })
        return
      }
      if (error instanceof Error) {
        // Erros de negócio retornam 400, erros internos 500
        const isBusinessError = error.message.includes('Cannot create') ||
          error.message.includes('must be provided') ||
          error.message.includes('cannot be empty') ||
          error.message.includes('Invalid')

        await reply.code(isBusinessError ? 400 : 500).send({ error: error.message })
        return
      }
      await reply.code(500).send({ error: 'Internal server error' })
    }
  }

  /**
   * GET /carts/me - Retorna carrinho atual
   *
   * Estratégia de identificação:
   * - Guest checkout: usa session_id (gerado no frontend e persistido)
   * - Usuário autenticado: usa customer_id (vindo do JWT ou body)
   * - Prioridade: cart_id > customer_id > session_id
   *
   * Segurança:
   * - session_id é validado (não pode ser vazio se fornecido)
   * - Todos os acessos são isolados por store_id (multi-tenant)
   */
  async getCart(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const storeId = request.storeId
      if (!storeId) {
        await reply.code(400).send({ error: 'Store ID is required' })
        return
      }

      const query = request.query as {
        session_id?: string
        customer_id?: string
        cart_id?: string
      }

      // Validação: session_id não pode ser string vazia
      if (query.session_id !== undefined && query.session_id.trim() === '') {
        await reply.code(400).send({ error: 'session_id cannot be empty' })
        return
      }

      // Validação: customer_id deve ser UUID válido se fornecido
      if (query.customer_id !== undefined && query.customer_id.trim() !== '') {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        if (!uuidRegex.test(query.customer_id)) {
          await reply.code(400).send({ error: 'Invalid customer_id format' })
          return
        }
      }

      // Validação: cart_id deve ser UUID válido se fornecido
      if (query.cart_id !== undefined && query.cart_id.trim() !== '') {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        if (!uuidRegex.test(query.cart_id)) {
          await reply.code(400).send({ error: 'Invalid cart_id format' })
          return
        }
      }

      const cart = await getCartUseCase(
        storeId,
        query.session_id,
        query.customer_id,
        query.cart_id,
        {
          cartRepository: this.cartRepository
        }
      )

      if (!cart) {
        await reply.code(404).send({ error: 'Cart not found' })
        return
      }

      await reply.send({ cart })
    } catch (error) {
      if (error instanceof Error) {
        await reply.code(500).send({ error: error.message })
        return
      }
      await reply.code(500).send({ error: 'Internal server error' })
    }
  }
}

