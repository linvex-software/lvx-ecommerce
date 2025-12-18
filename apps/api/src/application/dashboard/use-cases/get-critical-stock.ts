import type { CriticalStockProduct } from '../../../domain/dashboard/dashboard-types'
import type { ProductRepository } from '../../../infra/db/repositories/product-repository'

export interface GetCriticalStockDependencies {
  productRepository: ProductRepository
}

export async function getCriticalStockUseCase(
  storeId: string,
  dependencies: GetCriticalStockDependencies,
  minStockThreshold?: number
): Promise<CriticalStockProduct[]> {
  return await dependencies.productRepository.getCriticalStockProducts(
    storeId,
    minStockThreshold ?? 10
  )
}

