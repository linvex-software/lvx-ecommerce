import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'

export interface Customer {
  id: string
  name: string
  email: string | null
  cpf: string
  phone: string | null
  created_at: string
}

export interface CustomersResponse {
  customers: Customer[]
}

export function useCustomers() {
  return useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data } = await apiClient.get<CustomersResponse>('/admin/customers')
      return data.customers
    }
  })
}

