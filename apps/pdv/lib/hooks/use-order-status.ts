import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../api-client'

export interface OrderStatus {
  order_id: string
  status: string
  payment_status: 'pending' | 'paid' | 'refunded' | 'failed'
}

export function useOrderStatus(orderId: string | null, enabled: boolean = true) {
  return useQuery({
    queryKey: ['order-status', orderId],
    queryFn: async () => {
      if (!orderId) return null
      const response = await apiClient.get<OrderStatus>(
        `/physical-sales/order/${orderId}/status`
      )
      return response.data
    },
    enabled: enabled && !!orderId,
    refetchInterval: (data) => {
      // Polling a cada 3 segundos se o pagamento estiver pendente
      if (data?.payment_status === 'pending') {
        return 3000
      }
      return false
    }
  })
}

