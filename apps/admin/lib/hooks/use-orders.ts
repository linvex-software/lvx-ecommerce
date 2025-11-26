import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
export type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'failed'

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  variant_id: string | null
  quantity: number
  price: string
}

export interface Order {
  id: string
  store_id: string
  customer_id: string | null
  total: string
  status: OrderStatus
  payment_status: PaymentStatus
  shipping_cost: string
  shipping_label_url: string | null
  tracking_code: string | null
  created_at: string
  items?: OrderItem[]
}

export interface OrdersResponse {
  orders: Order[]
}

export interface OrderResponse {
  order: Order
}

export interface OrderFilters {
  status?: OrderStatus
  payment_status?: PaymentStatus
  customer_id?: string
}

export interface UpdateOrderInput {
  status?: OrderStatus
  payment_status?: PaymentStatus
  shipping_label_url?: string | null
  tracking_code?: string | null
}

export function useOrders(filters?: OrderFilters) {
  return useQuery({
    queryKey: ['orders', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.status) params.append('status', filters.status)
      if (filters?.payment_status) params.append('payment_status', filters.payment_status)
      if (filters?.customer_id) params.append('customer_id', filters.customer_id)

      const { data } = await apiClient.get<OrdersResponse>(
        `/admin/orders${params.toString() ? `?${params.toString()}` : ''}`
      )
      return data.orders
    }
  })
}

export function useOrder(orderId: string) {
  return useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const { data } = await apiClient.get<OrderResponse>(`/admin/orders/${orderId}`)
      return data.order
    },
    enabled: !!orderId
  })
}

export function useUpdateOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ orderId, data }: { orderId: string; data: UpdateOrderInput }) => {
      const { data: response } = await apiClient.put<OrderResponse>(`/admin/orders/${orderId}`, data)
      return response.order
    },
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['order', order.id] })
    }
  })
}

export function useDownloadShippingLabel() {
  return useMutation({
    mutationFn: async (orderId: string) => {
      const response = await apiClient.get(`/admin/orders/${orderId}/shipping-label`, {
        responseType: 'blob'
      })
      return response.data
    }
  })
}

