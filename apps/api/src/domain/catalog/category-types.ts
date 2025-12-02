export interface Category {
  id: string
  store_id: string
  name: string
  slug: string
  icon?: string | null
  created_at: Date
}

export interface CreateCategoryInput {
  name: string
  slug?: string
  icon?: string
}

export interface UpdateCategoryInput {
  name?: string
  slug?: string
  icon?: string
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

