import { z } from 'zod'
import { CategoryRepository } from '../../../infra/db/repositories/category-repository'
import type { CategoryListFilters, CategoryListResult } from '../../../domain/catalog/category-types'

const listCategoriesSchema = z.object({
  q: z.string().optional(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(100).optional()
})

export interface ListCategoriesDependencies {
  categoryRepository: CategoryRepository
}

export async function listCategoriesUseCase(
  storeId: string,
  filters: z.infer<typeof listCategoriesSchema>,
  dependencies: ListCategoriesDependencies
): Promise<CategoryListResult> {
  const { categoryRepository } = dependencies

  const validated = listCategoriesSchema.parse(filters)

  return await categoryRepository.listByStore(storeId, validated)
}

export { listCategoriesSchema }

