export type ProductStatus = 'draft' | 'active' | 'inactive'

export interface Product {
  id: string
  store_id: string
  name: string
  slug: string
  description: string | null
  base_price: string
  sku: string
  status: ProductStatus
  virtual_model_url: string | null
  virtual_provider: string | null
  virtual_config_json: Record<string, unknown> | null
  main_image: string | null
  category_name?: string | null
  variants?: string[]
  colors?: string[]
  sizes?: string[]
  created_at: Date
  updated_at: Date
}

export interface ProductVariant {
  id: string
  store_id: string
  product_id: string
  sku: string | null
  size: string | null
  color: string | null
  barcode: string | null
  price_override: string | null
  active: boolean
}

export interface ProductImage {
  id: string
  store_id: string
  product_id: string
  image_url: string
  position: number
  is_main: boolean
}

export interface ProductCategory {
  id: string
  product_id: string
  category_id: string
}

export interface ProductSeo {
  id: string
  store_id: string
  product_id: string
  meta_title: string | null
  meta_description: string | null
  meta_keywords: string | null
  open_graph_image: string | null
  created_at: Date
  updated_at: Date
}

export interface ProductSizeChart {
  id: string
  store_id: string
  product_id: string
  name: string
  chart_json: Record<string, unknown>
  created_at: Date
  updated_at: Date
}

export interface ProductWithRelations extends Omit<Product, 'variants'> {
  variants: ProductVariant[]
  images: ProductImage[]
  categories: Array<{
    id: string
    name: string
    slug: string
  }>
  seo: ProductSeo | null
  size_chart: ProductSizeChart | null
}

export interface CreateProductInput {
  store_id: string
  name: string
  slug: string
  description?: string | null
  base_price: number
  sku: string
  status?: ProductStatus
  virtual_model_url?: string | null
  virtual_provider?: string | null
  virtual_config_json?: Record<string, unknown> | null
  variants?: Array<{
    sku?: string | null
    size?: string | null
    color?: string | null
    barcode?: string | null
    price_override?: number | null
    active?: boolean
  }>
  images?: Array<{
    image_url: string
    position?: number
    is_main?: boolean
  }>
  category_ids?: string[]
  seo?: {
    meta_title?: string | null
    meta_description?: string | null
    meta_keywords?: string | null
    open_graph_image?: string | null
  }
  size_chart?: {
    name: string
    chart_json: Record<string, unknown>
  }
}

export interface UpdateProductInput {
  name?: string
  slug?: string
  description?: string | null
  base_price?: number
  sku?: string
  status?: ProductStatus
  virtual_model_url?: string | null
  virtual_provider?: string | null
  virtual_config_json?: Record<string, unknown> | null
  variants?: Array<{
    id?: string
    sku?: string | null
    size?: string | null
    color?: string | null
    barcode?: string | null
    price_override?: number | null
    active?: boolean
  }>
  images?: Array<{
    id?: string
    image_url: string
    position?: number
    is_main?: boolean
  }>
  category_ids?: string[]
  seo?: {
    meta_title?: string | null
    meta_description?: string | null
    meta_keywords?: string | null
    open_graph_image?: string | null
  }
  size_chart?: {
    name: string
    chart_json: Record<string, unknown>
  }
}

export interface ProductListFilters {
  q?: string
  category_id?: string
  status?: ProductStatus
  sizes?: string[]
  colors?: string[]
  min_price?: number
  max_price?: number
  page?: number
  limit?: number
}

export interface ProductListResult {
  products: Product[]
  total: number
  page: number
  limit: number
  totalPages: number
}

