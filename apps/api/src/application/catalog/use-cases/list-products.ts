import { z } from 'zod'
import { ProductRepository } from '../../../infra/db/repositories/product-repository'
import type { ProductListFilters, ProductListResult } from '../../../domain/catalog/product-types'

const listProductsSchema = z.object({
  q: z.string().optional(),
  category_id: z.string().uuid().optional(),
  status: z.enum(['draft', 'active', 'inactive']).optional(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(100).optional()
})

export interface ListProductsDependencies {
  productRepository: ProductRepository
}

export async function listProductsUseCase(
  storeId: string,
  filters: z.infer<typeof listProductsSchema>,
  dependencies: ListProductsDependencies
): Promise<ProductListResult> {
  const { productRepository } = dependencies

  const validated = listProductsSchema.parse(filters)

  return await productRepository.listByStore(storeId, validated)
}

export { listProductsSchema }

