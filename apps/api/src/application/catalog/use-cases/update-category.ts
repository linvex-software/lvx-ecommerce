
import { z } from 'zod'
import { CategoryRepository } from '../../../infra/db/repositories/category-repository'
import type { Category, UpdateCategoryInput } from '../../../domain/catalog/category-types'

const updateCategorySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').min(3, 'Nome deve ter pelo menos 3 caracteres').optional(),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Slug deve conter apenas letras minúsculas, números e hífens').optional(),
  parent_id: z.string().uuid().nullable().optional(),
  icon: z.string().optional()
})

export interface UpdateCategoryDependencies {
  categoryRepository: CategoryRepository
}

export async function updateCategoryUseCase(
  id: string,
  storeId: string,
  input: z.infer<typeof updateCategorySchema>,
  dependencies: UpdateCategoryDependencies
): Promise<Category> {
  const { categoryRepository } = dependencies

  const validated = updateCategorySchema.parse(input)

  // Verificar se categoria existe
  const existingCategory = await categoryRepository.findById(id, storeId)
  if (!existingCategory) {
    const error = new Error('Categoria não encontrada')
    ;(error as any).statusCode = 404
    throw error
  }

  // Se slug foi fornecido, verificar se já existe (e não é a mesma categoria)
  if (validated.slug) {
    const categoryWithSlug = await categoryRepository.findBySlug(validated.slug, storeId)
    if (categoryWithSlug && categoryWithSlug.id !== id) {
      const error = new Error('Já existe uma categoria com este slug')
      ;(error as any).statusCode = 409
      throw error
    }
  }

  const updated = await categoryRepository.update(id, storeId, {
    name: validated.name,
    slug: validated.slug,
    parent_id: validated.parent_id !== undefined ? (validated.parent_id || null) : undefined
  })

  if (!updated) {
    const error = new Error('Categoria não encontrada')
    ;(error as any).statusCode = 404
    throw error
  }

  return updated
}

export { updateCategorySchema }

