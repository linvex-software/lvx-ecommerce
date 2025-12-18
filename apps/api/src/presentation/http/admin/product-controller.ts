import type { FastifyRequest, FastifyReply } from 'fastify'
import { ZodError } from 'zod'
import {
  listProductsUseCase,
  listProductsSchema
} from '../../../application/catalog/use-cases/list-products'
import {
  getProductByIdUseCase,
  getProductBySlugUseCase
} from '../../../application/catalog/use-cases/get-product'
import {
  createProductUseCase,
  createProductSchema
} from '../../../application/catalog/use-cases/create-product'
import {
  updateProductUseCase,
  updateProductSchema
} from '../../../application/catalog/use-cases/update-product'
import { deleteProductUseCase } from '../../../application/catalog/use-cases/delete-product'
import {
  getProductStockUseCase,
  getProductStocksByProductUseCase
} from '../../../application/catalog/use-cases/get-product-stock'
import {
  createStockMovementUseCase,
  createStockMovementSchema
} from '../../../application/catalog/use-cases/create-stock-movement'
import { ProductRepository } from '../../../infra/db/repositories/product-repository'
import { StockMovementRepository } from '../../../infra/db/repositories/stock-movement-repository'

export class ProductController {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly stockMovementRepository: StockMovementRepository
  ) {}

  async list(
    request: FastifyRequest<{
      Querystring: {
        q?: string
        category_id?: string
        status?: string
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

      const filters = {
        q: request.query.q,
        category_id: request.query.category_id,
        status: request.query.status as 'draft' | 'active' | 'inactive' | undefined,
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

  async getById(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      const storeId = request.storeId
      if (!storeId) {
        await reply.code(400).send({ error: 'Store ID is required' })
        return
      }

      const { id } = request.params

      const product = await getProductByIdUseCase(id, storeId, {
        productRepository: this.productRepository
      })

      await reply.send({ product })
    } catch (error) {
      if (error instanceof Error) {
        const statusCode = error.message === 'Product not found' ? 404 : 500
        await reply.code(statusCode).send({ error: error.message })
        return
      }
      await reply.code(500).send({ error: 'Internal server error' })
    }
  }

  async create(request: FastifyRequest, reply: FastifyReply) {
    try {
      const storeId = request.storeId
      if (!storeId) {
        await reply.code(400).send({ error: 'Store ID is required' })
        return
      }

      const validated = createProductSchema.parse(request.body)

      const product = await createProductUseCase(validated, storeId, {
        productRepository: this.productRepository
      })

      await reply.code(201).send({ product })
    } catch (error) {
      if (error instanceof ZodError) {
        await reply.code(400).send({
          error: 'Validation error',
          details: error.errors
        })
        return
      }
      if (error instanceof Error) {
        const statusCode = error.message.includes('already exists') ? 409 : 500
        await reply.code(statusCode).send({ error: error.message })
        return
      }
      await reply.code(500).send({ error: 'Internal server error' })
    }
  }

  async update(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      const storeId = request.storeId
      if (!storeId) {
        await reply.code(400).send({ error: 'Store ID is required' })
        return
      }

      const { id } = request.params
      const validated = updateProductSchema.parse(request.body)

      const product = await updateProductUseCase(id, storeId, validated, {
        productRepository: this.productRepository
      })

      await reply.send({ product })
    } catch (error) {
      if (error instanceof ZodError) {
        await reply.code(400).send({
          error: 'Validation error',
          details: error.errors
        })
        return
      }
      if (error instanceof Error) {
        const statusCode =
          error.message === 'Product not found'
            ? 404
            : error.message.includes('already exists')
              ? 409
              : 500
        await reply.code(statusCode).send({ error: error.message })
        return
      }
      await reply.code(500).send({ error: 'Internal server error' })
    }
  }

  async delete(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      const storeId = request.storeId
      if (!storeId) {
        await reply.code(400).send({ error: 'Store ID is required' })
        return
      }

      const { id } = request.params

      await deleteProductUseCase(id, storeId, {
        productRepository: this.productRepository
      })

      await reply.code(204).send()
    } catch (error) {
      if (error instanceof Error) {
        let statusCode = 500
        
        if (error.message === 'Product not found') {
          statusCode = 404
        } else if (
          error.message.includes('associated orders') ||
          error.message.includes('associated physical sales')
        ) {
          statusCode = 409 // Conflict
        }
        
        await reply.code(statusCode).send({ error: error.message })
        return
      }
      await reply.code(500).send({ error: 'Internal server error' })
    }
  }

  async getStock(
    request: FastifyRequest<{
      Params: { id: string }
      Querystring: { variant_id?: string }
    }>,
    reply: FastifyReply
  ) {
    try {
      const storeId = request.storeId
      if (!storeId) {
        await reply.code(400).send({ error: 'Store ID is required' })
        return
      }

      const { id } = request.params
      const variantId = request.query.variant_id ?? null

      if (variantId === '') {
        // Se variant_id vazio, retornar todos os estoques do produto
        const stocks = await getProductStocksByProductUseCase(id, storeId, {
          stockMovementRepository: this.stockMovementRepository
        })
        await reply.send({ stocks })
        return
      }

      const stock = await getProductStockUseCase(
        id,
        storeId,
        variantId,
        {
          stockMovementRepository: this.stockMovementRepository
        }
      )

      await reply.send({ stock })
    } catch (error) {
      if (error instanceof Error) {
        const statusCode = error.message.includes('not found') ? 404 : 500
        await reply.code(statusCode).send({ error: error.message })
        return
      }
      await reply.code(500).send({ error: 'Internal server error' })
    }
  }

  async createStockMovement(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      const storeId = request.storeId
      if (!storeId) {
        await reply.code(400).send({ error: 'Store ID is required' })
        return
      }

      const { id } = request.params
      const user = request.user as { id: string; storeId: string; role: string } | undefined
      const userId = user?.id ?? null

      const body = request.body as Record<string, unknown>
      const validated = createStockMovementSchema.parse({
        ...body,
        product_id: id
      })

      const movement = await createStockMovementUseCase(
        validated,
        storeId,
        userId,
        {
          stockMovementRepository: this.stockMovementRepository
        }
      )

      await reply.code(201).send({ movement })
    } catch (error) {
      if (error instanceof ZodError) {
        await reply.code(400).send({
          error: 'Validation error',
          details: error.errors
        })
        return
      }
      if (error instanceof Error) {
        await reply.code(500).send({ error: error.message })
        return
      }
      await reply.code(500).send({ error: 'Internal server error' })
    }
  }
}

