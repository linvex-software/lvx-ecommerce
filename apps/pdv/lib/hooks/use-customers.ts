import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../api-client'

export interface Customer {
  id: string
  store_id: string
  name: string
  email: string | null
  cpf: string
  phone: string | null
  created_at: string
}

export interface CreateCustomerInput {
  name: string
  cpf: string
  email?: string | null
  phone?: string | null
}

export function useSearchCustomers(searchTerm: string) {
  return useQuery({
    queryKey: ['customers', 'search', searchTerm],
    queryFn: async () => {
      const response = await apiClient.get<{ customers: Customer[] }>(
        `/admin/customers/search?q=${encodeURIComponent(searchTerm)}`
      )
      return response.data.customers
    },
    enabled: searchTerm.length >= 2
  })
}

export function useCreateCustomer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateCustomerInput) => {
      const response = await apiClient.post<{ customer: Customer }>(
        '/admin/customers/quick',
        input
      )
      return response.data.customer
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
    }
  })
}

