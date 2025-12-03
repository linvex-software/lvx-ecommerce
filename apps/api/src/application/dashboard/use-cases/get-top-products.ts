import type { TopProduct } from '../../../domain/dashboard/dashboard-types'
import type { OrderRepository } from '../../../infra/db/repositories/order-repository'

export interface GetTopProductsDependencies {
  orderRepository: OrderRepository
}

export async function getTopProductsUseCase(
  storeId: string,
  dependencies: GetTopProductsDependencies
): Promise<TopProduct[]> {
  return await dependencies.orderRepository.getTopProducts(storeId, 30, 10)
}

