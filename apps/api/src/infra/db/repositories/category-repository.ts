import { db, schema } from '@white-label/db'
import { eq, and, or, like, desc, sql, count } from 'drizzle-orm'
import type {
  Category,
  CreateCategoryInput,
  UpdateCategoryInput,
  CategoryListFilters,
  CategoryListResult
} from '../../../domain/catalog/category-types'

export class CategoryRepository {
  async listByStore(
    storeId: string,
    filters?: CategoryListFilters
  ): Promise<CategoryListResult> {
    const page = filters?.page ?? 1
    const limit = filters?.limit ?? 50
    const offset = (page - 1) * limit

    const conditions = [eq(schema.categories.store_id, storeId)]

    if (filters?.q) {
      conditions.push(
        or(
          like(schema.categories.name, `%${filters.q}%`),
          like(schema.categories.slug, `%${filters.q}%`)
        )!
      )
    }

    const [categories, totalResult] = await Promise.all([
      db
        .select()
        .from(schema.categories)
        .where(and(...conditions))
        .orderBy(schema.categories.parent_id, desc(schema.categories.created_at))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: count() })
        .from(schema.categories)
        .where(and(...conditions))
    ])

    const total = totalResult[0]?.count ?? 0
    const totalPages = Math.ceil(total / limit)

    return {
      categories: categories.map(this.mapToDomain),
      total,
      page,
      limit,
      totalPages
    }
  }

  /**
   * Lista todas as categorias de uma loja organizadas em árvore hierárquica
   */
  async listTreeByStore(storeId: string): Promise<Category[]> {
    const allCategories = await db
      .select()
      .from(schema.categories)
      .where(eq(schema.categories.store_id, storeId))
      .orderBy(schema.categories.parent_id, schema.categories.name)

    return allCategories.map(this.mapToDomain)
  }

  async findById(id: string, storeId: string): Promise<Category | null> {
    const [category] = await db
      .select()
      .from(schema.categories)
      .where(and(eq(schema.categories.id, id), eq(schema.categories.store_id, storeId)))
      .limit(1)

    return category ? this.mapToDomain(category) : null
  }

  async findBySlug(slug: string, storeId: string): Promise<Category | null> {
    const [category] = await db
      .select()
      .from(schema.categories)
      .where(
        and(
          eq(schema.categories.slug, slug),
          eq(schema.categories.store_id, storeId)
        )
      )
      .limit(1)

    return category ? this.mapToDomain(category) : null
  }

  async create(
    storeId: string,
    input: CreateCategoryInput
  ): Promise<Category> {
    const slug = input.slug || this.generateSlug(input.name)

    // Validar se parent_id existe e pertence à mesma loja
    if (input.parent_id) {
      const parent = await this.findById(input.parent_id, storeId)
      if (!parent) {
        throw new Error('Categoria pai não encontrada')
      }
    }

    const [category] = await db
      .insert(schema.categories)
      .values({
        store_id: storeId,
        parent_id: input.parent_id || null,
        name: input.name,
        slug
      })
      .returning()

    return this.mapToDomain(category)
  }

  async update(
    id: string,
    storeId: string,
    input: UpdateCategoryInput
  ): Promise<Category | null> {
    // Validar loops hierárquicos
    if (input.parent_id === id) {
      throw new Error('Uma categoria não pode ser filha de si mesma')
    }

    if (input.parent_id) {
      // Verificar se a categoria pai existe e pertence à mesma loja
      const parent = await this.findById(input.parent_id, storeId)
      if (!parent) {
        throw new Error('Categoria pai não encontrada')
      }

      // Verificar se a categoria pai não é descendente da categoria atual (prevenir loops)
      const isDescendant = await this.isDescendant(input.parent_id, id, storeId)
      if (isDescendant) {
        throw new Error('Não é possível definir uma categoria como filha de sua própria descendente')
      }
    }

    const updateData: {
      name?: string
      slug?: string
      parent_id?: string | null
    } = {}

    if (input.name !== undefined) {
      updateData.name = input.name
    }

    if (input.slug !== undefined) {
      updateData.slug = input.slug
    } else if (input.name !== undefined) {
      // Se o nome mudou mas o slug não foi fornecido, gerar novo slug
      updateData.slug = this.generateSlug(input.name)
    }

    if (input.parent_id !== undefined) {
      updateData.parent_id = input.parent_id || null
    }

    const [category] = await db
      .update(schema.categories)
      .set(updateData)
      .where(and(eq(schema.categories.id, id), eq(schema.categories.store_id, storeId)))
      .returning()

    return category ? this.mapToDomain(category) : null
  }

  /**
   * Verifica se uma categoria é descendente de outra
   */
  private async isDescendant(categoryId: string, ancestorId: string, storeId: string): Promise<boolean> {
    let currentId: string | null = categoryId
    const visited = new Set<string>()

    while (currentId && !visited.has(currentId)) {
      visited.add(currentId)
      
      const category = await this.findById(currentId, storeId)
      if (!category) break

      if (category.parent_id === ancestorId) {
        return true
      }

      currentId = category.parent_id
    }

    return false
  }

  async delete(id: string, storeId: string): Promise<boolean> {
    const result = await db
      .delete(schema.categories)
      .where(and(eq(schema.categories.id, id), eq(schema.categories.store_id, storeId)))
      .returning()

    return result.length > 0
  }

  private mapToDomain(row: typeof schema.categories.$inferSelect): Category {
    return {
      id: row.id,
      store_id: row.store_id,
      parent_id: row.parent_id || null,
      name: row.name,
      slug: row.slug,
      created_at: row.created_at
    }
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }
}
 