import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchAPI } from '@/lib/api'
import { useAuthStore } from '@/lib/store/useAuthStore'

export interface CustomerAddress {
  id: string
  customer_id: string
  street: string
  city: string
  state: string
  zip: string
  is_default: boolean
}

interface CreateAddressInput {
  street: string
  city: string
  state: string
  zip: string
  is_default?: boolean
}

interface UpdateAddressInput {
  street?: string
  city?: string
  state?: string
  zip?: string
  is_default?: boolean
}

export function useAddresses() {
  const { accessToken, customer } = useAuthStore()
  const isAuthenticated = !!(accessToken && customer)

  return useQuery({
    queryKey: ['customer-addresses'],
    queryFn: async () => {
      const data = await fetchAPI('/customers/me/addresses')
      return data.addresses as CustomerAddress[]
    },
    enabled: isAuthenticated,
  })
}

export function useCreateAddress() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateAddressInput) => {
      const data = await fetchAPI('/customers/me/addresses', {
        method: 'POST',
        body: JSON.stringify(input),
      })
      return data.address as CustomerAddress
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-addresses'] })
    },
  })
}

export function useUpdateAddress() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateAddressInput & { id: string }) => {
      const data = await fetchAPI(`/customers/me/addresses/${id}`, {
        method: 'PUT',
        body: JSON.stringify(input),
      })
      return data.address as CustomerAddress
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-addresses'] })
    },
  })
}

export function useDeleteAddress() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await fetchAPI(`/customers/me/addresses/${id}`, {
        method: 'DELETE',
      })
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-addresses'] })
    },
  })
}

export function useSetDefaultAddress() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const data = await fetchAPI(`/customers/me/addresses/${id}/default`, {
        method: 'PATCH',
      })
      return data.address as CustomerAddress
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-addresses'] })
    },
  })
}

