import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api-client'

export interface Product {
  id: string
  name: string
  slug: string
  description: string | null
  category_id: string | null
  category_name?: string
  price: number
  stock: number
  image_url: string | null
  active: boolean
  created_at: string
  updated_at: string
}

export interface ProductFilters {
  name?: string
  category_id?: string
  active?: boolean
  page?: number
  limit?: number
}

export interface ProductsResponse {
  products: Product[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface CreateProductInput {
  name: string
  slug: string
  description?: string
  category_id?: string
  price: number
  stock: number
  image_url?: string
  active: boolean
}

export interface UpdateProductInput extends Partial<CreateProductInput> {
  id: string
}

const PRODUCTS_QUERY_KEY = ['products']

export function useProducts(filters?: ProductFilters) {
  return useQuery({
    queryKey: [...PRODUCTS_QUERY_KEY, filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.name) params.append('name', filters.name)
      if (filters?.category_id) params.append('category_id', filters.category_id)
      if (filters?.active !== undefined) params.append('active', String(filters.active))
      if (filters?.page) params.append('page', String(filters.page))
      if (filters?.limit) params.append('limit', String(filters.limit))

      const response = await apiClient.get<ProductsResponse>(
        `/admin/products?${params.toString()}`
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
      const response = await apiClient.get<{ product: Product }>(`/admin/products/${id}`)
      return response.data.product
    },
    enabled: !!id
  })
}

export function useCreateProduct() {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: async (data: CreateProductInput) => {
      const response = await apiClient.post<{ product: Product }>('/admin/products', data)
      return response.data.product
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY })
      router.push('/products')
    }
  })
}

export function useUpdateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: UpdateProductInput) => {
      const { id, ...updateData } = data
      const response = await apiClient.put<{ product: Product }>(
        `/admin/products/${id}`,
        updateData
      )
      return response.data.product
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY })
    }
  })
}

export function useDeleteProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/admin/products/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY })
    }
  })
}

export function useToggleProductStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const response = await apiClient.patch<{ product: Product }>(
        `/admin/products/${id}/status`,
        { active }
      )
      return response.data.product
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY })
    }
  })
}

