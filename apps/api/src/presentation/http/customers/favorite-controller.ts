import type { FastifyRequest, FastifyReply } from 'fastify'
import { FavoriteRepository } from '../../../infra/db/repositories/favorite-repository'
import { ProductRepository } from '../../../infra/db/repositories/product-repository'
import { addFavoriteUseCase, addFavoriteSchema } from '../../../application/favorites/use-cases/add-favorite'
import { removeFavoriteUseCase, removeFavoriteSchema } from '../../../application/favorites/use-cases/remove-favorite'
import { listFavoritesUseCase } from '../../../application/favorites/use-cases/list-favorites'
import { checkFavoriteUseCase, checkFavoriteSchema } from '../../../application/favorites/use-cases/check-favorite'

export class FavoriteController {
  private favoriteRepository: FavoriteRepository
  private productRepository: ProductRepository

  constructor(
    favoriteRepository: FavoriteRepository,
    productRepository: ProductRepository
  ) {
    this.favoriteRepository = favoriteRepository
    this.productRepository = productRepository
  }

  async add(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const customer = request.customer
      const storeId = request.storeId

      if (!customer || !storeId) {
        console.log('[FavoriteController.add] Não autorizado - customer ou storeId ausente')
        await reply.code(401).send({ error: 'Unauthorized' })
        return
      }

      console.log('[FavoriteController.add] Recebendo requisição:', {
        storeId,
        customerId: customer.id,
        body: request.body
      })

      const body = addFavoriteSchema.parse(request.body)

      console.log('[FavoriteController.add] Body validado:', body)

      const result = await addFavoriteUseCase(
        storeId,
        customer.id,
        body,
        {
          favoriteRepository: this.favoriteRepository,
          productRepository: this.productRepository
        }
      )

      console.log('[FavoriteController.add] Use case executado com sucesso:', result)

      // Serializar created_at para string ISO
      const response = {
        favorite: {
          ...result.favorite,
          created_at: result.favorite.created_at instanceof Date 
            ? result.favorite.created_at.toISOString() 
            : result.favorite.created_at
        }
      }

      await reply.code(201).send(response)
    } catch (error) {
      console.error('[FavoriteController.add] Erro capturado:', error)
      if (error instanceof Error) {
        console.error('[FavoriteController.add] Mensagem de erro:', error.message)
        if (error.message.includes('já está nos favoritos')) {
          await reply.code(409).send({ error: error.message })
          return
        }
        if (error.message.includes('não encontrado') || error.message.includes('não está disponível')) {
          await reply.code(404).send({ error: error.message })
          return
        }
        await reply.code(400).send({ error: error.message })
        return
      }
      await reply.code(500).send({ error: 'Internal server error' })
    }
  }

  async remove(request: FastifyRequest<{ Params: { productId: string } }>, reply: FastifyReply): Promise<void> {
    try {
      const customer = request.customer
      const storeId = request.storeId

      if (!customer || !storeId) {
        await reply.code(401).send({ error: 'Unauthorized' })
        return
      }

      const body = removeFavoriteSchema.parse({
        product_id: request.params.productId
      })

      await removeFavoriteUseCase(
        storeId,
        customer.id,
        body,
        {
          favoriteRepository: this.favoriteRepository
        }
      )

      await reply.code(204).send()
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('não está nos favoritos')) {
          await reply.code(404).send({ error: error.message })
          return
        }
        await reply.code(400).send({ error: error.message })
        return
      }
      await reply.code(500).send({ error: 'Internal server error' })
    }
  }

  async list(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const customer = request.customer
      const storeId = request.storeId

      if (!customer || !storeId) {
        await reply.code(401).send({ error: 'Unauthorized' })
        return
      }

      const result = await listFavoritesUseCase(
        storeId,
        customer.id,
        {
          favoriteRepository: this.favoriteRepository
        }
      )

      await reply.code(200).send(result)
    } catch (error) {
      await reply.code(500).send({ error: 'Internal server error' })
    }
  }

  async check(request: FastifyRequest<{ Params: { productId: string } }>, reply: FastifyReply): Promise<void> {
    try {
      const customer = request.customer
      const storeId = request.storeId

      if (!customer || !storeId) {
        await reply.code(401).send({ error: 'Unauthorized' })
        return
      }

      const body = checkFavoriteSchema.parse({
        product_id: request.params.productId
      })

      const result = await checkFavoriteUseCase(
        storeId,
        customer.id,
        body,
        {
          favoriteRepository: this.favoriteRepository
        }
      )

      await reply.code(200).send(result)
    } catch (error) {
      await reply.code(400).send({ error: 'Invalid request' })
    }
  }
}

