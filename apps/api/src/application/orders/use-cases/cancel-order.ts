import { z } from 'zod'
import type { Order } from '../../../domain/orders/order-types'
import type { OrderRepository } from '../../../infra/db/repositories/order-repository'
import type { StockMovementRepository } from '../../../infra/db/repositories/stock-movement-repository'

const cancelOrderSchema = z.object({
  orderId: z.string().uuid(),
  reason: z.string().optional().nullable()
})

export interface CancelOrderDependencies {
  orderRepository: OrderRepository
  stockMovementRepository: StockMovementRepository
}

export async function cancelOrderUseCase(
  input: z.infer<typeof cancelOrderSchema>,
  storeId: string,
  userId: string | null,
  dependencies: CancelOrderDependencies
): Promise<Order> {
  const { orderRepository, stockMovementRepository } = dependencies

  const validated = cancelOrderSchema.parse(input)

  // Buscar pedido
  const order = await orderRepository.findByIdWithItems(validated.orderId, storeId)
  if (!order) {
    throw new Error('Pedido não encontrado')
  }

  // Validar se o pedido pode ser cancelado
  if (order.status === 'cancelled') {
    throw new Error('Pedido já está cancelado')
  }

  if (order.status === 'delivered') {
    throw new Error('Não é possível cancelar um pedido já entregue')
  }

  // Estornar estoque de cada item
  for (const item of order.items) {
    await stockMovementRepository.create({
      store_id: storeId,
      product_id: item.product_id,
      variant_id: item.variant_id,
      type: 'IN',
      origin: 'order_cancellation',
      quantity: item.quantity,
      reason: validated.reason 
        ? `Cancelamento do pedido #${order.id.slice(0, 8)} - ${validated.reason}`
        : `Cancelamento do pedido #${order.id.slice(0, 8)}`,
      final_quantity: null,
      created_by: userId
    })
  }

  // Atualizar status do pedido
  const updatedOrder = await orderRepository.update(validated.orderId, storeId, {
    status: 'cancelled',
    payment_status: order.payment_status === 'paid' ? 'refunded' : order.payment_status
  })

  return updatedOrder
}

export { cancelOrderSchema }

