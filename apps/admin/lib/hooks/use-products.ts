import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api-client'

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
  name: string
  slug: string
}

export interface ProductSEO {
  id: string
  store_id: string
  product_id: string
  meta_title: string | null
  meta_description: string | null
  meta_keywords: string | null
  open_graph_image: string | null
  created_at: string
  updated_at: string
}

export interface ProductSizeChart {
  id: string
  store_id: string
  product_id: string
  name: string
  chart_json: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  store_id: string
  name: string
  slug: string
  description: string | null
  base_price: string
  sku: string
  status: 'draft' | 'active' | 'inactive'
  virtual_model_url: string | null
  virtual_provider: string | null
  virtual_config_json: Record<string, unknown> | null
  main_image?: string | null
  category_name?: string | null
  created_at: string
  updated_at: string
  variants?: ProductVariant[]
  images?: ProductImage[]
  categories?: ProductCategory[]
  seo?: ProductSEO
  size_chart?: ProductSizeChart
}

export interface ProductFilters {
  q?: string
  category_id?: string
  status?: 'draft' | 'active' | 'inactive'
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
  description?: string | null
  base_price: number
  sku: string
  status?: 'draft' | 'active' | 'inactive'
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
  id: string
  name?: string
  slug?: string
  description?: string | null
  base_price?: number
  sku?: string
  status?: 'draft' | 'active' | 'inactive'
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

const PRODUCTS_QUERY_KEY = ['products']

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
    onSuccess: (product) => {
      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY })
      toast.success('Produto criado com sucesso!', {
        description: `${product.name} foi adicionado ao catálogo.`
      })
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
    onSuccess: (product) => {
      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY })
      toast.success('Produto atualizado com sucesso!', {
        description: `${product.name} foi atualizado com sucesso.`
      })
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
      toast.success('Produto excluído com sucesso!', {
        description: 'O produto foi removido permanentemente.'
      })
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.error || 'Erro ao excluir produto'
      
      if (errorMessage.includes('associated orders') || errorMessage.includes('associated physical sales')) {
        toast.error('Não é possível excluir este produto', {
          description: 'O produto possui pedidos ou vendas físicas associadas. Não é possível excluí-lo permanentemente.'
        })
      } else {
        toast.error('Erro ao excluir produto', {
          description: errorMessage
        })
      }
    }
  })
}

export function useToggleProductStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'draft' | 'active' | 'inactive' }) => {
      const response = await apiClient.put<{ product: Product }>(
        `/admin/products/${id}`,
        { status }
      )
      return response.data.product
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY })
    }
  })
}

// Estoque
export interface StockInfo {
  product_id: string
  variant_id: string | null
  current_stock: number
  last_movement_at: string | null
}

export interface StockMovement {
  id: string
  store_id: string
  product_id: string
  variant_id: string | null
  type: 'IN' | 'OUT' | 'ADJUST'
  origin: string
  quantity: number
  reason: string | null
  final_quantity: number | null
  created_by: string | null
  created_at: string
}

export interface CreateStockMovementInput {
  variant_id?: string | null
  type: 'IN' | 'OUT' | 'ADJUST'
  origin?: 'manual' | 'order' | 'physical_sale' | 'adjustment' | 'return'
  quantity: number
  reason?: string | null
  final_quantity?: number | null
}

export function useProductStock(productId: string | null, variantId?: string | null) {
  return useQuery({
    queryKey: ['product-stock', productId, variantId],
    queryFn: async () => {
      if (!productId) return null
      const params = new URLSearchParams()
      
      // Se variantId for undefined, buscar todos os estoques (produto + variantes)
      // Passando variant_id vazio, a API retorna todos
      if (variantId === undefined) {
        params.append('variant_id', '')
      } else if (variantId !== null) {
        params.append('variant_id', variantId)
      }

      const response = await apiClient.get<{ stock?: StockInfo; stocks?: StockInfo[] }>(
        `/admin/products/${productId}/stock?${params.toString()}`
      )
      return response.data
    },
    enabled: !!productId
  })
}

export function useCreateStockMovement(productId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateStockMovementInput) => {
      const response = await apiClient.post<{ movement: StockMovement }>(
        `/admin/products/${productId}/stock/movements`,
        data
      )
      return response.data.movement
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['product-stock', productId] })
      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY })
    }
  })
}

