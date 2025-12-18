import type { OperationalMetrics } from '../../../domain/dashboard/dashboard-types'
import type { OrderRepository } from '../../../infra/db/repositories/order-repository'
import type { ProductRepository } from '../../../infra/db/repositories/product-repository'

export interface GetOperationalMetricsDependencies {
  orderRepository: OrderRepository
  productRepository: ProductRepository
}

export async function getOperationalMetricsUseCase(
  storeId: string,
  dependencies: GetOperationalMetricsDependencies
): Promise<OperationalMetrics> {
  const metrics = await dependencies.orderRepository.getOperationalMetrics(storeId)
  
  // Buscar produtos com estoque crítico
  const criticalProducts = await dependencies.productRepository.getCriticalStockProducts(storeId)
  
  return {
    ...metrics,
    lowStock: criticalProducts.length
  }
}

