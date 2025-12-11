import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../api-client'
import type { Customer } from './use-customers'

export function useCustomerById(customerId: string | null) {
  return useQuery({
    queryKey: ['customer', customerId],
    queryFn: async () => {
      if (!customerId) return null
      // Buscar cliente via search (não temos endpoint específico por ID)
      const response = await apiClient.get<{ customers: Customer[] }>(
        `/admin/customers/search?q=${customerId}`
      )
      return response.data.customers.find((c) => c.id === customerId) || null
    },
    enabled: !!customerId
  })
}

