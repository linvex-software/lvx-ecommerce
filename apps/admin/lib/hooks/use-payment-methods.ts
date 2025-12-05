import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../api-client'
import { toast } from 'sonner'

export interface PaymentMethod {
  id: string
  store_id: string
  name: string
  provider: string
  config_json: Record<string, unknown> | null
  active: boolean
  created_at: string
}

export function usePaymentMethods() {
  return useQuery<PaymentMethod[]>({
    queryKey: ['payment-methods'],
    queryFn: async () => {
      const response = await apiClient.get<PaymentMethod[]>('/admin/payment-methods')
      return response.data
    }
  })
}

export function usePaymentMethod(id: string | null) {
  return useQuery<PaymentMethod>({
    queryKey: ['payment-method', id],
    queryFn: async () => {
      if (!id) throw new Error('Payment method ID is required')
      const response = await apiClient.get<PaymentMethod>(`/admin/payment-methods/${id}`)
      return response.data
    },
    enabled: !!id
  })
}

export function useCreatePaymentMethod() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      name: string
      provider: string
      config_json?: Record<string, unknown> | null
      active?: boolean
    }) => {
      const response = await apiClient.post<PaymentMethod>('/admin/payment-methods', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] })
      toast.success('Método de pagamento criado com sucesso!')
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || 'Erro ao criar método de pagamento'
      toast.error(message)
    }
  })
}

export function useUpdatePaymentMethod() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      data
    }: {
      id: string
      data: {
        name?: string
        config_json?: Record<string, unknown> | null
        active?: boolean
      }
    }) => {
      const response = await apiClient.put<PaymentMethod>(`/admin/payment-methods/${id}`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] })
      queryClient.invalidateQueries({ queryKey: ['payment-method'] })
      toast.success('Método de pagamento atualizado com sucesso!')
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || 'Erro ao atualizar método de pagamento'
      toast.error(message)
    }
  })
}


