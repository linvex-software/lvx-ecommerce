import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchAPI } from '@/lib/api'
import { useAuthStore } from '@/lib/store/useAuthStore'

interface CustomerProfile {
  id: string
  store_id: string
  name: string
  email: string | null
  cpf: string
  phone: string | null
  created_at: string
}

interface UpdateProfileInput {
  name?: string
  email?: string | null
  phone?: string | null
}

export function useCustomerProfile() {
  const { accessToken, customer } = useAuthStore()
  const isAuthenticated = !!(accessToken && customer)

  return useQuery({
    queryKey: ['customer-profile'],
    queryFn: async () => {
      const data = await fetchAPI('/customers/me')
      return data.customer as CustomerProfile
    },
    enabled: isAuthenticated,
  })
}

export function useUpdateCustomerProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: UpdateProfileInput) => {
      const data = await fetchAPI('/customers/me', {
        method: 'PUT',
        body: JSON.stringify(input),
      })
      return data.customer as CustomerProfile
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-profile'] })
    },
  })
}

