import type { SalesByDay } from '../../../domain/dashboard/dashboard-types'
import type { OrderRepository } from '../../../infra/db/repositories/order-repository'

export interface GetSalesByPeriodDependencies {
  orderRepository: OrderRepository
}

export async function getSalesByPeriodUseCase(
  storeId: string,
  startDate: Date,
  endDate: Date,
  dependencies: GetSalesByPeriodDependencies
): Promise<SalesByDay[]> {
  return await dependencies.orderRepository.getSalesByPeriod(storeId, startDate, endDate)
}

