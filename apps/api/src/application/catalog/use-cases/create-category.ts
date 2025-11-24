import { z } from 'zod'
import { CategoryRepository } from '../../../infra/db/repositories/category-repository'
import type { Category, CreateCategoryInput } from '../../../domain/catalog/category-types'
// ConflictError será lançado como Error comum

const createCategorySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').min(3, 'Nome deve ter pelo menos 3 caracteres'),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Slug deve conter apenas letras minúsculas, números e hífens').optional()
})

export interface CreateCategoryDependencies {
  categoryRepository: CategoryRepository
}

export async function createCategoryUseCase(
  storeId: string,
  input: z.infer<typeof createCategorySchema>,
  dependencies: CreateCategoryDependencies
): Promise<Category> {
  const { categoryRepository } = dependencies

  const validated = createCategorySchema.parse(input)

  // Gerar slug se não fornecido
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  const slug = validated.slug || generateSlug(validated.name)
  const existingCategory = await categoryRepository.findBySlug(slug, storeId)

  if (existingCategory) {
    const error = new Error('Já existe uma categoria com este slug')
    ;(error as any).statusCode = 409
    throw error
  }

  return await categoryRepository.create(storeId, {
    name: validated.name,
    slug: validated.slug
  })
}

export { createCategorySchema }

