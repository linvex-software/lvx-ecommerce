import { StockMovementRepository } from '../../../infra/db/repositories/stock-movement-repository'
import type { ProductStock } from '../../../domain/catalog/stock-types'

export interface GetProductStockDependencies {
  stockMovementRepository: StockMovementRepository
}

export async function getProductStockUseCase(
  productId: string,
  storeId: string,
  variantId: string | null | undefined,
  dependencies: GetProductStockDependencies
): Promise<ProductStock> {
  const { stockMovementRepository } = dependencies

  const stock = await stockMovementRepository.getProductStock(
    productId,
    storeId,
    variantId
  )

  if (!stock) {
    throw new Error('Product stock not found')
  }

  return stock
}

export async function getProductStocksByProductUseCase(
  productId: string,
  storeId: string,
  dependencies: GetProductStockDependencies
): Promise<ProductStock[]> {
  const { stockMovementRepository } = dependencies

  return await stockMovementRepository.getProductStocksByProduct(productId, storeId)
}

