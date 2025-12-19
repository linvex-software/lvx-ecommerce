/**
 * Tipos de domínio para Landing Pages e Páginas Dinâmicas
 */

export interface LandingPage {
  id: string
  storeId: string
  title: string
  slug: string
  published: boolean
  contentJson?: Record<string, unknown> | null
  createdAt: Date
  updatedAt: Date
}

export interface DynamicPageProduct {
  id: string
  dynamicPageId: string
  productId: string
  orderIndex: number
  createdAt: Date
}

export interface LandingPageWithProducts extends LandingPage {
  products: Array<{
    id: string
    productId: string
    orderIndex: number
    product?: {
      id: string
      name: string
      slug: string
      basePrice: string
      sku: string
      status: string
      mainImage?: string | null
    }
  }>
}

export interface CreateDynamicPageInput {
  title: string
  slug: string
  published?: boolean
  contentJson?: Record<string, unknown> | null
}

export interface UpdateDynamicPageInput {
  title?: string
  slug?: string
  published?: boolean
  contentJson?: Record<string, unknown> | null
}

export interface SetPageProductsInput {
  productIds: string[]
}

