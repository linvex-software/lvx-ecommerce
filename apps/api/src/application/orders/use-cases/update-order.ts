import { OrderRepository } from '../../../infra/db/repositories/order-repository'
import type { Order, UpdateOrderInput } from '../../../domain/orders/order-types'

export interface UpdateOrderDependencies {
  orderRepository: OrderRepository
}

export async function updateOrderUseCase(
  orderId: string,
  storeId: string,
  data: UpdateOrderInput,
  dependencies: UpdateOrderDependencies
): Promise<Order> {
  const { orderRepository } = dependencies

  return await orderRepository.update(orderId, storeId, data)
}

