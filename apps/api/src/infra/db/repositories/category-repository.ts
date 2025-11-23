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
        .orderBy(desc(schema.categories.created_at))
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

    const [category] = await db
      .insert(schema.categories)
      .values({
        store_id: storeId,
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
    const updateData: {
      name?: string
      slug?: string
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

    const [category] = await db
      .update(schema.categories)
      .set(updateData)
      .where(and(eq(schema.categories.id, id), eq(schema.categories.store_id, storeId)))
      .returning()

    return category ? this.mapToDomain(category) : null
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

