import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'

interface CancelOrderParams {
  orderId: string
  reason?: string | null
}

interface CancelOrderResponse {
  order: {
    id: string
    status: string
    payment_status: string
  }
  message: string
}

export function useCancelOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ orderId, reason }: CancelOrderParams) => {
      const response = await apiClient.post<CancelOrderResponse>(
        `/admin/orders/${orderId}/cancel`,
        { reason }
      )
      return response.data
    },
    onSuccess: (data) => {
      // Invalidar queries relacionadas a pedidos
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['order', data.order.id] })
    }
  })
}

