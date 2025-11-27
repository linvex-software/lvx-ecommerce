import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../api-client'

export interface Product {
  id: string
  store_id: string
  name: string
  slug: string
  description: string | null
  base_price: string
  sku: string
  status: 'draft' | 'active' | 'inactive'
  main_image?: string | null
  created_at: string
  updated_at: string
}

export interface ProductsResponse {
  products: Product[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ProductFilters {
  q?: string
  category_id?: string
  status?: 'draft' | 'active' | 'inactive'
  page?: number
  limit?: number
}

export interface StockInfo {
  product_id: string
  variant_id: string | null
  current_stock: number
  last_movement_at: string | null
}

const PRODUCTS_QUERY_KEY = ['pdv-products']

export function useProducts(filters?: ProductFilters) {
  return useQuery({
    queryKey: [...PRODUCTS_QUERY_KEY, filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.q) params.append('q', filters.q)
      if (filters?.category_id) params.append('category_id', filters.category_id)
      if (filters?.status) params.append('status', filters.status)
      if (filters?.page) params.append('page', String(filters.page))
      if (filters?.limit) params.append('limit', String(filters.limit))

      const response = await apiClient.get<ProductsResponse>(
        `/pdv/products?${params.toString()}`
      )
      return response.data
    }
  })
}

export function useProduct(id: string | null) {
  return useQuery({
    queryKey: [...PRODUCTS_QUERY_KEY, id],
    queryFn: async () => {
      if (!id) return null
      const response = await apiClient.get<{ product: Product }>(`/pdv/products/${id}`)
      return response.data.product
    },
    enabled: !!id
  })
}

export function useProductStock(productId: string | null, variantId?: string | null) {
  return useQuery({
    queryKey: ['pdv-product-stock', productId, variantId],
    queryFn: async () => {
      if (!productId) return null
      const params = new URLSearchParams()
      
      if (variantId === undefined) {
        params.append('variant_id', '')
      } else if (variantId !== null) {
        params.append('variant_id', variantId)
      }

      const response = await apiClient.get<{ stock?: StockInfo; stocks?: StockInfo[] }>(
        `/pdv/products/${productId}/stock?${params.toString()}`
      )
      return response.data
    },
    enabled: !!productId
  })
}

