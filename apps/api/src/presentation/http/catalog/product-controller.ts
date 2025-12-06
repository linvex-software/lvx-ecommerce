import type { FastifyRequest, FastifyReply } from 'fastify'
import {
  listProductsUseCase,
  listProductsSchema
} from '../../../application/catalog/use-cases/list-products'
import { getProductBySlugUseCase } from '../../../application/catalog/use-cases/get-product'
import { getProductStockUseCase } from '../../../application/catalog/use-cases/get-product-stock'
import { ProductRepository } from '../../../infra/db/repositories/product-repository'
import { StockMovementRepository } from '../../../infra/db/repositories/stock-movement-repository'

export class PublicProductController {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly stockMovementRepository: StockMovementRepository
  ) { }

  async list(
    request: FastifyRequest<{
      Querystring: {
        q?: string
        category_id?: string
        page?: string
        limit?: string
      }
    }>,
    reply: FastifyReply
  ) {
    try {
      const storeId = request.storeId
      if (!storeId) {
        await reply.code(400).send({ error: 'Store ID is required' })
        return
      }

      // Apenas produtos ativos para público
      const filters = {
        q: request.query.q,
        category_id: request.query.category_id,
        status: 'active' as const, // TODO: Uncomment when products have status
        sizes: request.query.sizes ? (Array.isArray(request.query.sizes) ? request.query.sizes : [request.query.sizes]) : undefined,
        colors: request.query.colors ? (Array.isArray(request.query.colors) ? request.query.colors : [request.query.colors]) : undefined,
        min_price: request.query.min_price ? Number.parseFloat(request.query.min_price) : undefined,
        max_price: request.query.max_price ? Number.parseFloat(request.query.max_price) : undefined,
        page: request.query.page ? Number.parseInt(request.query.page, 10) : undefined,
        limit: request.query.limit ? Number.parseInt(request.query.limit, 10) : undefined
      }

      const result = await listProductsUseCase(storeId, filters, {
        productRepository: this.productRepository
      })

      await reply.send(result)
    } catch (error) {
      if (error instanceof Error) {
        await reply.code(500).send({ error: error.message })
        return
      }
      await reply.code(500).send({ error: 'Internal server error' })
    }
  }

  async getBySlug(
    request: FastifyRequest<{ Params: { slug: string } }>,
    reply: FastifyReply
  ) {
    try {
      const storeId = request.storeId
      if (!storeId) {
        await reply.code(400).send({ error: 'Store ID is required' })
        return
      }

      const { slug } = request.params

      const product = await getProductBySlugUseCase(slug, storeId, {
        productRepository: this.productRepository
      })

      // Buscar estoque do produto (sem variante específica)
      let stock = null
      try {
        stock = await getProductStockUseCase(
          product.id,
          storeId,
          null, // variantId = null para estoque do produto base
          {
            stockMovementRepository: this.stockMovementRepository
          }
        )
      } catch (error) {
        // Se não houver movimentos de estoque, retorna null (estoque = 0)
        // Não quebra a resposta do produto
      }

      await reply.send({
        product: {
          ...product,
          stock: stock
            ? {
                current_stock: stock.current_stock
              }
            : {
                current_stock: 0
              }
        }
      })
    } catch (error) {
      if (error instanceof Error) {
        const statusCode = error.message === 'Product not found' ? 404 : 500
        await reply.code(statusCode).send({ error: error.message })
        return
      }
      await reply.code(500).send({ error: 'Internal server error' })
    }
  }

  async getAvailableSizes(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    try {
      const storeId = request.storeId
      if (!storeId) {
        await reply.code(400).send({ error: 'Store ID is required' })
        return
      }

      const sizes = await this.productRepository.getAvailableSizes(storeId)
      await reply.send({ sizes })
    } catch (error) {
      if (error instanceof Error) {
        await reply.code(500).send({ error: error.message })
        return
      }
      await reply.code(500).send({ error: 'Internal server error' })
    }
  }
}

