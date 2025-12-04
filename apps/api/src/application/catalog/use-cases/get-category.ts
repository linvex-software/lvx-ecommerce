import { CategoryRepository } from '../../../infra/db/repositories/category-repository'
import type { Category } from '../../../domain/catalog/category-types'
// NotFoundError será lançado como Error comum

export interface GetCategoryDependencies {
  categoryRepository: CategoryRepository
}

export async function getCategoryUseCase(
  id: string,
  storeId: string,
  dependencies: GetCategoryDependencies
): Promise<Category> {
  const { categoryRepository } = dependencies

  const category = await categoryRepository.findById(id, storeId)

  if (!category) {
    const error = new Error('Categoria não encontrada')
    ;(error as any).statusCode = 404
    throw error
  }

  return category
}

export async function getCategoryBySlugUseCase(
  slug: string,
  storeId: string,
  dependencies: GetCategoryDependencies
): Promise<Category> {
  const { categoryRepository } = dependencies

  const category = await categoryRepository.findBySlug(slug, storeId)

  if (!category) {
    const error = new Error('Categoria não encontrada')
    ;(error as any).statusCode = 404
    throw error
  }

  return category
}

