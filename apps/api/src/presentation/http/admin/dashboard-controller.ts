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

      // Parsear datas corretamente: YYYY-MM-DD deve ser tratado como início/fim do dia no timezone local
      let endDate: Date
      let startDate: Date

      // Função helper para parsear YYYY-MM-DD no timezone local
      const parseLocalDate = (dateStr: string, isEndOfDay: boolean = false): Date => {
        const [year, month, day] = dateStr.split('-').map(Number)
        // new Date(year, month, day) cria no timezone local (month é 0-indexed)
        const date = new Date(year, month - 1, day)
        if (isEndOfDay) {
          date.setHours(23, 59, 59, 999)
        } else {
          date.setHours(0, 0, 0, 0)
        }
        return date
      }

      if (endDateStr) {
        // Se fornecido, usar fim do dia (23:59:59.999) no timezone local
        endDate = parseLocalDate(endDateStr, true)
      } else {
        endDate = new Date()
        endDate.setHours(23, 59, 59, 999)
      }

      if (startDateStr) {
        // Se fornecido, usar início do dia (00:00:00) no timezone local
        startDate = parseLocalDate(startDateStr, false)
      } else {
        // Se não fornecido, padrão de 30 dias atrás
        startDate = new Date()
        startDate.setDate(startDate.getDate() - 30)
        startDate.setHours(0, 0, 0, 0)
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

      // Parsear datas corretamente: YYYY-MM-DD deve ser tratado como início/fim do dia no timezone local
      let endDate: Date
      let startDate: Date

      // Função helper para parsear YYYY-MM-DD no timezone local
      const parseLocalDate = (dateStr: string, isEndOfDay: boolean = false): Date => {
        const [year, month, day] = dateStr.split('-').map(Number)
        // new Date(year, month, day) cria no timezone local (month é 0-indexed)
        const date = new Date(year, month - 1, day)
        if (isEndOfDay) {
          date.setHours(23, 59, 59, 999)
        } else {
          date.setHours(0, 0, 0, 0)
        }
        return date
      }

      if (endDateStr) {
        // Se fornecido, usar fim do dia (23:59:59.999) no timezone local
        endDate = parseLocalDate(endDateStr, true)
      } else {
        endDate = new Date()
        endDate.setHours(23, 59, 59, 999)
      }

      if (startDateStr) {
        // Se fornecido, usar início do dia (00:00:00) no timezone local
        startDate = parseLocalDate(startDateStr, false)
      } else {
        // Se não fornecido, padrão de 30 dias atrás
        startDate = new Date()
        startDate.setDate(startDate.getDate() - 30)
        startDate.setHours(0, 0, 0, 0)
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

