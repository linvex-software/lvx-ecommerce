import { OrderRepository } from '../../../../infra/db/repositories/order-repository'
import type { OrderWithItems } from '../../../../domain/orders/order-types'

export interface GetOrderReceiptDependencies {
  orderRepository: OrderRepository
}

export async function getOrderReceiptUseCase(
  orderId: string,
  storeId: string,
  dependencies: GetOrderReceiptDependencies
): Promise<OrderWithItems> {
  const { orderRepository } = dependencies

  const order = await orderRepository.findByIdWithItems(orderId, storeId)
  if (!order) {
    throw new Error('Order not found')
  }

  return order
}

