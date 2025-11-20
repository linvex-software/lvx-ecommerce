import { ProductRepository } from '../../../infra/db/repositories/product-repository'

export interface DeleteProductDependencies {
  productRepository: ProductRepository
}

export async function deleteProductUseCase(
  id: string,
  storeId: string,
  dependencies: DeleteProductDependencies
): Promise<void> {
  const { productRepository } = dependencies

  // Verificar se produto existe
  const existingProduct = await productRepository.findById(id, storeId)
  if (!existingProduct) {
    throw new Error('Product not found')
  }

  await productRepository.softDelete(id, storeId)
}

