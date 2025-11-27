import type { FastifyRequest, FastifyReply } from 'fastify'
import { ZodError } from 'zod'
import {
  createPhysicalSaleUseCase,
  createPhysicalSaleSchema
} from '../../../application/physical-sales/use-cases/create-physical-sale'
import {
  listPhysicalSalesUseCase,
  listPhysicalSalesSchema
} from '../../../application/physical-sales/use-cases/list-physical-sales'
import {
  getPhysicalSalesReportByProductUseCase,
  getPhysicalSalesReportByProductSchema
} from '../../../application/physical-sales/use-cases/get-physical-sales-report-by-product'
import { PhysicalSaleRepository } from '../../../infra/db/repositories/physical-sale-repository'
import { ProductRepository } from '../../../infra/db/repositories/product-repository'
import { StockMovementRepository } from '../../../infra/db/repositories/stock-movement-repository'
import { CouponRepository } from '../../../infra/db/repositories/coupon-repository'
import { PhysicalSalesCartRepository } from '../../../infra/db/repositories/physical-sales-cart-repository'
import { PhysicalSalesCommissionRepository } from '../../../infra/db/repositories/physical-sales-commission-repository'
import {
  createPhysicalSalesCartUseCase,
  createPhysicalSalesCartSchema
} from '../../../application/physical-sales/use-cases/create-physical-sales-cart'
import { abandonPhysicalSalesCartUseCase } from '../../../application/physical-sales/use-cases/abandon-physical-sales-cart'
import { listAbandonedCartsUseCase } from '../../../application/physical-sales/use-cases/list-abandoned-carts'

export class PhysicalSalesController {
  constructor(
    private readonly physicalSaleRepository: PhysicalSaleRepository,
    private readonly productRepository: ProductRepository,
    private readonly stockMovementRepository: StockMovementRepository,
    private readonly couponRepository: CouponRepository,
    private readonly physicalSalesCartRepository: PhysicalSalesCartRepository,
    private readonly physicalSalesCommissionRepository: PhysicalSalesCommissionRepository
  ) {}

  async create(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const storeId = request.storeId
      if (!storeId) {
        await reply.code(400).send({ error: 'Store ID is required' })
        return
      }

      const userId = request.user?.id
      if (!userId) {
        await reply.code(401).send({ error: 'User ID is required' })
        return
      }

      const validated = createPhysicalSaleSchema.parse(request.body)

      const sale = await createPhysicalSaleUseCase(
        validated,
        storeId,
        userId,
        {
          physicalSaleRepository: this.physicalSaleRepository,
          productRepository: this.productRepository,
          stockMovementRepository: this.stockMovementRepository,
          couponRepository: this.couponRepository,
          physicalSalesCartRepository: this.physicalSalesCartRepository,
          physicalSalesCommissionRepository: this.physicalSalesCommissionRepository
        }
      )

      await reply.code(201).send({ sale })
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
          error.message === 'Product not found' ||
          error.message === 'Insufficient stock' ||
          error.message.includes('Total mismatch') ||
          error.message.includes('Cupom')
            ? 400
            : 500
        await reply.code(statusCode).send({ error: error.message })
        return
      }
      await reply.code(500).send({ error: 'Internal server error' })
    }
  }

  async list(
    request: FastifyRequest<{
      Querystring: {
        start_date?: string
        end_date?: string
        seller_id?: string
        product_id?: string
        page?: string
        limit?: string
      }
    }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const storeId = request.storeId
      if (!storeId) {
        await reply.code(400).send({ error: 'Store ID is required' })
        return
      }

      const result = await listPhysicalSalesUseCase(
        storeId,
        request.query,
        {
          physicalSaleRepository: this.physicalSaleRepository
        }
      )

      await reply.send(result)
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

  async getReportByProduct(
    request: FastifyRequest<{
      Querystring: {
        start_date?: string
        end_date?: string
        seller_id?: string
      }
    }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const storeId = request.storeId
      if (!storeId) {
        await reply.code(400).send({ error: 'Store ID is required' })
        return
      }

      const report = await getPhysicalSalesReportByProductUseCase(
        storeId,
        request.query,
        {
          physicalSaleRepository: this.physicalSaleRepository
        }
      )

      await reply.send({ report })
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

  async createCart(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const storeId = request.storeId
      if (!storeId) {
        await reply.code(400).send({ error: 'Store ID is required' })
        return
      }

      const userId = request.user?.id
      if (!userId) {
        await reply.code(401).send({ error: 'User ID is required' })
        return
      }

      const validated = createPhysicalSalesCartSchema.parse(request.body)

      const cart = await createPhysicalSalesCartUseCase(
        validated,
        storeId,
        userId,
        {
          physicalSalesCartRepository: this.physicalSalesCartRepository,
          productRepository: this.productRepository,
          couponRepository: this.couponRepository
        }
      )

      await reply.code(201).send({ cart })
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
          error.message.includes('not found') || error.message.includes('Cart must')
            ? 400
            : 500
        await reply.code(statusCode).send({ error: error.message })
        return
      }
      await reply.code(500).send({ error: 'Internal server error' })
    }
  }

  async abandonCart(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const storeId = request.storeId
      if (!storeId) {
        await reply.code(400).send({ error: 'Store ID is required' })
        return
      }

      const userId = request.user?.id
      if (!userId) {
        await reply.code(401).send({ error: 'User ID is required' })
        return
      }

      const { id } = request.params

      await abandonPhysicalSalesCartUseCase(id, storeId, userId, {
        physicalSalesCartRepository: this.physicalSalesCartRepository
      })

      await reply.code(204).send()
      return
    } catch (error) {
      if (error instanceof Error) {
        const statusCode =
          error.message === 'Cart not found' || error.message.includes('does not belong')
            ? 404
            : error.message.includes('not active')
            ? 400
            : 500
        await reply.code(statusCode).send({ error: error.message })
        return
      }
      await reply.code(500).send({ error: 'Internal server error' })
    }
  }

  async listAbandonedCarts(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const storeId = request.storeId
      if (!storeId) {
        await reply.code(400).send({ error: 'Store ID is required' })
        return
      }

      const userId = request.user?.id

      const carts = await listAbandonedCartsUseCase(
        storeId,
        userId ?? undefined,
        {
          physicalSalesCartRepository: this.physicalSalesCartRepository
        }
      )

      await reply.send({ carts })
    } catch (error) {
      if (error instanceof Error) {
        await reply.code(500).send({ error: error.message })
        return
      }
      await reply.code(500).send({ error: 'Internal server error' })
    }
  }
}

