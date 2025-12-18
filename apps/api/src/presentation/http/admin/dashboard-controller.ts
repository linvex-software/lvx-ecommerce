import type { FastifyRequest, FastifyReply } from 'fastify'
import { ZodError } from 'zod'
import { getTopProductsUseCase } from '../../../application/dashboard/use-cases/get-top-products'
import { getSalesByPeriodUseCase } from '../../../application/dashboard/use-cases/get-sales-by-period'
import { getRevenueMetricsUseCase } from '../../../application/dashboard/use-cases/get-revenue-metrics'
import { getOperationalMetricsUseCase } from '../../../application/dashboard/use-cases/get-operational-metrics'
import { getCriticalStockUseCase } from '../../../application/dashboard/use-cases/get-critical-stock'
import type { OrderRepository } from '../../../infra/db/repositories/order-repository'
import type { ProductRepository } from '../../../infra/db/repositories/product-repository'

export class DashboardController {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly productRepository: ProductRepository
  ) {}

  async getTopProducts(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const storeId = request.storeId
      if (!storeId) {
        await reply.code(400).send({ error: 'Store ID is required' })
        return
      }

      const topProducts = await getTopProductsUseCase(storeId, {
        orderRepository: this.orderRepository
      })

      await reply.code(200).send({ products: topProducts })
    } catch (error) {
      if (error instanceof ZodError) {
        await reply.code(400).send({
          error: 'Invalid request',
          details: error.errors
        })
        return
      }

      request.log.error(error)
      await reply.code(500).send({ error: 'Internal server error' })
    }
  }

  async getSalesByPeriod(
    request: FastifyRequest<{
      Querystring: {
        start_date?: string
        end_date?: string
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

      const startDateStr = request.query.start_date
      const endDateStr = request.query.end_date

      const endDate = endDateStr ? new Date(endDateStr) : new Date()
      const startDate = startDateStr ? new Date(startDateStr) : new Date()
      // Se não fornecido, padrão de 30 dias
      if (!startDateStr) {
        startDate.setDate(startDate.getDate() - 30)
      }

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        await reply.code(400).send({ error: 'Invalid date format. Use YYYY-MM-DD' })
        return
      }

      const sales = await getSalesByPeriodUseCase(
        storeId,
        startDate,
        endDate,
        {
          orderRepository: this.orderRepository
        }
      )

      await reply.code(200).send({ sales })
    } catch (error) {
      if (error instanceof ZodError) {
        await reply.code(400).send({
          error: 'Invalid request',
          details: error.errors
        })
        return
      }

      request.log.error(error)
      await reply.code(500).send({ error: 'Internal server error' })
    }
  }

  async getRevenueMetrics(
    request: FastifyRequest<{
      Querystring: {
        start_date?: string
        end_date?: string
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

      const startDateStr = request.query.start_date
      const endDateStr = request.query.end_date

      const endDate = endDateStr ? new Date(endDateStr) : new Date()
      const startDate = startDateStr ? new Date(startDateStr) : new Date()
      // Se não fornecido, padrão de 30 dias
      if (!startDateStr) {
        startDate.setDate(startDate.getDate() - 30)
      }

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        await reply.code(400).send({ error: 'Invalid date format. Use YYYY-MM-DD' })
        return
      }

      const metrics = await getRevenueMetricsUseCase(
        storeId,
        startDate,
        endDate,
        {
          orderRepository: this.orderRepository
        }
      )

      await reply.code(200).send(metrics)
    } catch (error) {
      request.log.error(error)
      await reply.code(500).send({ error: 'Internal server error' })
    }
  }

  async getOperationalMetrics(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const storeId = request.storeId
      if (!storeId) {
        await reply.code(400).send({ 
          error: 'Store ID is required',
          details: 'The store ID was not found in the request. Make sure you are authenticated and your token contains a storeId.'
        })
        return
      }

      const metrics = await getOperationalMetricsUseCase(storeId, {
        orderRepository: this.orderRepository,
        productRepository: this.productRepository
      })

      await reply.code(200).send(metrics)
    } catch (error) {
      request.log.error(error, 'Error getting operational metrics')
      await reply.code(500).send({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  async getCriticalStock(
    request: FastifyRequest<{
      Querystring: {
        min_stock?: string
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

      const minStockThreshold = request.query.min_stock
        ? parseInt(request.query.min_stock, 10)
        : 10

      if (isNaN(minStockThreshold)) {
        await reply.code(400).send({ error: 'Invalid min_stock value' })
        return
      }

      const products = await getCriticalStockUseCase(
        storeId,
        {
          productRepository: this.productRepository
        },
        minStockThreshold
      )

      await reply.code(200).send({ products })
    } catch (error) {
      request.log.error(error)
      await reply.code(500).send({ error: 'Internal server error' })
    }
  }
}

