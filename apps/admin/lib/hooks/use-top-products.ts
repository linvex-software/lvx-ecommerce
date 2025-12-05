import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'

export interface TopProduct {
  id: string
  name: string
  sku: string
  unitsSold: number
  revenue: string
  category: string | null
}

export interface TopProductsResponse {
  products: TopProduct[]
}

export function useTopProducts() {
  return useQuery({
    queryKey: ['top-products'],
    queryFn: async () => {
      const response = await apiClient.get<TopProductsResponse>(
        '/admin/dashboard/top-products'
      )
      return response.data.products
    },
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
    refetchOnWindowFocus: false
  })
}

