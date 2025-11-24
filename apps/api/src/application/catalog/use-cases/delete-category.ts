import { CategoryRepository } from '../../../infra/db/repositories/category-repository'

export interface DeleteCategoryDependencies {
  categoryRepository: CategoryRepository
}

export async function deleteCategoryUseCase(
  id: string,
  storeId: string,
  dependencies: DeleteCategoryDependencies
): Promise<void> {
  const { categoryRepository } = dependencies

  // Verificar se categoria existe
  const category = await categoryRepository.findById(id, storeId)
  if (!category) {
    const error = new Error('Categoria não encontrada')
    ;(error as any).statusCode = 404
    throw error
  }

  const deleted = await categoryRepository.delete(id, storeId)

  if (!deleted) {
    const error = new Error('Categoria não encontrada')
    ;(error as any).statusCode = 404
    throw error
  }
}

