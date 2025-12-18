import type { FastifyRequest, FastifyReply } from 'fastify'
import { listOrdersUseCase } from '../../../application/orders/use-cases/list-orders'
import { getOrderUseCase } from '../../../application/orders/use-cases/get-order'
import { updateOrderUseCase } from '../../../application/orders/use-cases/update-order'
import { cancelOrderUseCase } from '../../../application/orders/use-cases/cancel-order'
import { OrderRepository } from '../../../infra/db/repositories/order-repository'
import { StockMovementRepository } from '../../../infra/db/repositories/stock-movement-repository'
import type { ListOrdersFilters, UpdateOrderInput } from '../../../domain/orders/order-types'
import { ZodError } from 'zod'

export class OrderController {
  constructor(private readonly orderRepository: OrderRepository) {}

  async list(
    request: FastifyRequest<{
      Querystring: {
        status?: string
        payment_status?: string
        customer_id?: string
        start_date?: string
        end_date?: string
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

      const filters: ListOrdersFilters = {}
      if (request.query.status) {
        filters.status = request.query.status as ListOrdersFilters['status']
      }
      if (request.query.payment_status) {
        filters.payment_status = request.query.payment_status as ListOrdersFilters['payment_status']
      }
      if (request.query.customer_id) {
        filters.customer_id = request.query.customer_id
      }
      if (request.query.start_date) {
        filters.start_date = request.query.start_date
      }
      if (request.query.end_date) {
        filters.end_date = request.query.end_date
      }

      const orders = await listOrdersUseCase(storeId, filters, {
        orderRepository: this.orderRepository
      })

      await reply.send({ orders })
    } catch (error) {
      if (error instanceof Error) {
        await reply.code(500).send({ error: error.message })
        return
      }
      await reply.code(500).send({ error: 'Internal server error' })
    }
  }

  async get(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const storeId = request.storeId
      if (!storeId) {
        await reply.code(400).send({ error: 'Store ID is required' })
        return
      }

      const { id } = request.params

      const order = await getOrderUseCase(id, storeId, {
        orderRepository: this.orderRepository
      })

      if (!order) {
        await reply.code(404).send({ error: 'Order not found' })
        return
      }

      await reply.send({ order })
    } catch (error) {
      if (error instanceof Error) {
        await reply.code(500).send({ error: error.message })
        return
      }
      await reply.code(500).send({ error: 'Internal server error' })
    }
  }

  async update(request: FastifyRequest<{ Params: { id: string }; Body: UpdateOrderInput }>, reply: FastifyReply) {
    try {
      const storeId = request.storeId
      if (!storeId) {
        await reply.code(400).send({ error: 'Store ID is required' })
        return
      }

      const { id } = request.params
      const data = request.body

      const order = await updateOrderUseCase(id, storeId, data, {
        orderRepository: this.orderRepository
      })

      await reply.send({ order })
    } catch (error) {
      if (error instanceof Error) {
        const statusCode = error.message === 'Order not found' ? 404 : 500
        await reply.code(statusCode).send({ error: error.message })
        return
      }
      await reply.code(500).send({ error: 'Internal server error' })
    }
  }

  async downloadShippingLabel(
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

      const order = await getOrderUseCase(id, storeId, {
        orderRepository: this.orderRepository
      })

      if (!order) {
        await reply.code(404).send({ error: 'Order not found' })
        return
      }

      if (!order.shipping_label_url) {
        await reply.code(404).send({ error: 'Shipping label not available for this order' })
        return
      }

      // Se a URL for um link externo, redireciona
      if (order.shipping_label_url.startsWith('http://') || order.shipping_label_url.startsWith('https://')) {
        await reply.redirect(order.shipping_label_url)
        return
      }

      // Se for um caminho local ou base64, você pode implementar lógica específica aqui
      // Por enquanto, retornamos a URL para o frontend lidar
      await reply.send({ url: order.shipping_label_url })
    } catch (error) {
      if (error instanceof Error) {
        await reply.code(500).send({ error: error.message })
        return
      }
      await reply.code(500).send({ error: 'Internal server error' })
    }
  }

  async cancel(
    request: FastifyRequest<{ 
      Params: { id: string }
      Body: { reason?: string | null }
    }>, 
    reply: FastifyReply
  ) {
    try {
      const storeId = request.storeId
      if (!storeId) {
        await reply.code(400).send({ error: 'Store ID is required' })
        return
      }

      const userId = (request.user as { id?: string } | undefined)?.id || null
      const { id } = request.params
      const body = request.body || {}

      const stockMovementRepository = new StockMovementRepository()

      const order = await cancelOrderUseCase(
        {
          orderId: id,
          reason: body.reason || null
        },
        storeId,
        userId,
        {
          orderRepository: this.orderRepository,
          stockMovementRepository
        }
      )

      await reply.send({ 
        order,
        message: 'Pedido cancelado com sucesso. Estoque estornado automaticamente.' 
      })
    } catch (error) {
      if (error instanceof ZodError) {
        await reply.code(400).send({
          error: 'Erro de validação',
          details: error.errors
        })
        return
      }
      if (error instanceof Error) {
        const statusCode = 
          error.message.includes('não encontrado') ? 404 :
          error.message.includes('já está cancelado') ||
          error.message.includes('já entregue') ||
          error.message.includes('não é possível') ? 400 :
          500
        await reply.code(statusCode).send({ error: error.message })
        return
      }
      await reply.code(500).send({ error: 'Internal server error' })
    }
  }
}

