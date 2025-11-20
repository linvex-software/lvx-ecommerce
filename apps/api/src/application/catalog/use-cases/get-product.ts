import { ProductRepository } from '../../../infra/db/repositories/product-repository'
import type { ProductWithRelations } from '../../../domain/catalog/product-types'

export interface GetProductDependencies {
  productRepository: ProductRepository
}

export async function getProductByIdUseCase(
  id: string,
  storeId: string,
  dependencies: GetProductDependencies
): Promise<ProductWithRelations> {
  const { productRepository } = dependencies

  const product = await productRepository.findByIdWithRelations(id, storeId)

  if (!product) {
    throw new Error('Product not found')
  }

  return product
}

export async function getProductBySlugUseCase(
  slug: string,
  storeId: string,
  dependencies: GetProductDependencies
): Promise<ProductWithRelations> {
  const { productRepository } = dependencies

  const product = await productRepository.findBySlugWithRelations(slug, storeId)

  if (!product) {
    throw new Error('Product not found')
  }

  return product
}

