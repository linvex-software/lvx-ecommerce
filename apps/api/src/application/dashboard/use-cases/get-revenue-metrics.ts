import type { RevenueMetrics } from '../../../domain/dashboard/dashboard-types'
import type { OrderRepository } from '../../../infra/db/repositories/order-repository'

export interface GetRevenueMetricsDependencies {
  orderRepository: OrderRepository
}

export async function getRevenueMetricsUseCase(
  storeId: string,
  startDate: Date,
  endDate: Date,
  dependencies: GetRevenueMetricsDependencies
): Promise<RevenueMetrics> {
  return await dependencies.orderRepository.getRevenueMetrics(storeId, startDate, endDate)
}

