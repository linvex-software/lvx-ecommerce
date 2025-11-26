import { OrderRepository } from '../../../infra/db/repositories/order-repository'
import type { Order, ListOrdersFilters } from '../../../domain/orders/order-types'

export interface ListOrdersDependencies {
  orderRepository: OrderRepository
}

export async function listOrdersUseCase(
  storeId: string,
  filters: ListOrdersFilters,
  dependencies: ListOrdersDependencies
): Promise<Order[]> {
  const { orderRepository } = dependencies

  return await orderRepository.listByStore(storeId, filters)
}

