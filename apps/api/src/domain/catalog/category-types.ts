export interface Category {
  id: string
  store_id: string
  parent_id: string | null
  name: string
  slug: string
  created_at: Date
}

export interface CreateCategoryInput {
  name: string
  slug?: string
  parent_id?: string | null
}

export interface UpdateCategoryInput {
  name?: string
  slug?: string
  parent_id?: string | null
}

export interface CategoryListFilters {
  page?: number
  limit?: number
  q?: string
}

export interface CategoryListResult {
  categories: Category[]
  total: number
  page: number
  limit: number
  totalPages: number
}
 