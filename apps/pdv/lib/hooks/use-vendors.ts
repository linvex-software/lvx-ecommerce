import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../api-client'

export interface Vendor {
  id: string
  name: string
  email: string
  role: 'vendedor'
  created_at: string
}

export interface VendorsResponse {
  vendors: Vendor[]
}

export function useVendors() {
  return useQuery({
    queryKey: ['vendors'],
    queryFn: async () => {
      const response = await apiClient.get<VendorsResponse>('/admin/users/vendors')
      return response.data
    },
    staleTime: 30000, // Cache por 30 segundos
    refetchOnWindowFocus: false
  })
}

