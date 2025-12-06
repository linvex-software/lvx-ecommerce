import { OrderRepository } from '../../../infra/db/repositories/order-repository'
import type { OrderWithItems } from '../../../domain/orders/order-types'

export interface GetOrderDependencies {
  orderRepository: OrderRepository
}

export async function getOrderUseCase(
  orderId: string,
  storeId: string,
  dependencies: GetOrderDependencies
): Promise<OrderWithItems | null> {
  const { orderRepository } = dependencies

  return await orderRepository.findByIdWithItems(orderId, storeId)
}

