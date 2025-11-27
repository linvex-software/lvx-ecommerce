import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../api-client'

export interface PhysicalSale {
  id: string
  product: {
    id: string
    name: string
    base_price: string
  }
  quantity: number
  subtotal: number
  discount: number
  total: number
  shipping_cost_amount?: number
  seller?: {
    id: string
    name: string
    email: string
  }
  created_at: string
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

export interface PhysicalSalesListResponse {
  sales: PhysicalSale[]
  total: number
  page: number
  limit: number
}

export function usePhysicalSales(filters?: {
  start_date?: string
  end_date?: string
  seller_id?: string
  page?: number
  limit?: number
}) {
  return useQuery<PhysicalSalesListResponse>({
    queryKey: ['physical-sales', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.start_date) params.append('start_date', filters.start_date)
      if (filters?.end_date) params.append('end_date', filters.end_date)
      if (filters?.seller_id) params.append('seller_id', filters.seller_id)
      if (filters?.page) params.append('page', filters.page.toString())
      if (filters?.limit) params.append('limit', filters.limit.toString())

      const response = await apiClient.get<PhysicalSalesListResponse>(
        `/physical-sales?${params.toString()}`
      )
      return response.data
    }
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
      queryClient.invalidateQueries({ queryKey: ['physical-sales'] })
    }
  })
}

export function usePhysicalSalesReport(filters?: {
  start_date?: string
  end_date?: string
  seller_id?: string
}) {
  return useQuery({
    queryKey: ['physical-sales-report', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.start_date) params.append('start_date', filters.start_date)
      if (filters?.end_date) params.append('end_date', filters.end_date)
      if (filters?.seller_id) params.append('seller_id', filters.seller_id)

      const response = await apiClient.get(
        `/physical-sales/report-by-product?${params.toString()}`
      )
      return response.data
    }
  })
}

