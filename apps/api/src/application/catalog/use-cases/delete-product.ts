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

  // Hard delete do produto (deleta do banco de dados)
  // O método já valida existência e relacionamentos
  await productRepository.delete(id, storeId)
}

