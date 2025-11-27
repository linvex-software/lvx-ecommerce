import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../api-client'

export interface PhysicalSale {
  id: string
  store_id: string
  product_id: string
  quantity: number
  subtotal?: number
  discount?: number
  total: number | string // pode vir como string do backend (Drizzle numeric)
  seller_user_id: string
  status: string
  created_at: string
  product: {
    id: string
    name: string
    sku: string
    base_price: string
  }
}

export interface CreatePhysicalSaleInput {
  product_id: string
  quantity: number
  total: number
  coupon_code?: string | null
  shipping_address?: {
    zip_code: string
  } | null
  commission_rate?: number | null
}

const PHYSICAL_SALES_QUERY_KEY = ['physical-sales']

// Hook para listar vendas físicas
export function usePhysicalSales(filters?: {
  start_date?: string
  end_date?: string
  seller_id?: string
}) {
  return useQuery({
    queryKey: [...PHYSICAL_SALES_QUERY_KEY, filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.start_date) params.append('start_date', filters.start_date)
      if (filters?.end_date) params.append('end_date', filters.end_date)
      if (filters?.seller_id) params.append('seller_id', filters.seller_id)

      const response = await apiClient.get<{ sales: PhysicalSale[] }>(
        `/physical-sales?${params.toString()}`
      )
      return response.data
    },
    refetchInterval: 30000 // Atualiza a cada 30s
  })
}

export function useCreatePhysicalSale() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreatePhysicalSaleInput) => {
      const response = await apiClient.post<{ sale: PhysicalSale }>('/physical-sales', input)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PHYSICAL_SALES_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: ['pdv-product-stock'] })
    }
  })
}

