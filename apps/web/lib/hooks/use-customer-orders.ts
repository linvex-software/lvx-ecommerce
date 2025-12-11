import { useQuery } from '@tanstack/react-query'
import { fetchAPI } from '@/lib/api'
import { useAuthStore } from '@/lib/store/useAuthStore'

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  product_name: string
  variant_id: string | null
  quantity: number
  price: string
}

export interface Order {
  id: string
  store_id: string
  customer_id: string | null
  status: string
  payment_status: string
  total: string
  shipping_cost: string
  tracking_code: string | null
  created_at: string
  items: OrderItem[]
  shipping_address?: {
    zip_code: string
    street: string
    number: string | null
    complement: string | null
    neighborhood: string | null
    city: string
    state: string
    country: string
  }
}

export function useCustomerOrders() {
  const { accessToken, customer } = useAuthStore()
  const isAuthenticated = !!(accessToken && customer)

  return useQuery({
    queryKey: ['customer-orders'],
    queryFn: async () => {
      const data = await fetchAPI('/customers/me/orders')
      return (data as { orders: Order[] }).orders
    },
    enabled: isAuthenticated,
    staleTime: 30 * 1000, // Cache por 30 segundos
  })
}

export function useCustomerOrder(orderId: string) {
  const { accessToken, customer } = useAuthStore()
  const isAuthenticated = !!(accessToken && customer)

  return useQuery({
    queryKey: ['customer-order', orderId],
    queryFn: async () => {
      const data = await fetchAPI(`/customers/me/orders/${orderId}`)
      return (data as { order: Order }).order
    },
    enabled: isAuthenticated && !!orderId,
    staleTime: 30 * 1000, // Cache por 30 segundos
  })
}

