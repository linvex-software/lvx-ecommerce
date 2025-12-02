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

// TODO: Implementar endpoint GET /customers/me/orders no backend
// Por enquanto, retorna array vazio
export function useCustomerOrders() {
  const { accessToken, customer } = useAuthStore()
  const isAuthenticated = !!(accessToken && customer)

  return useQuery({
    queryKey: ['customer-orders'],
    queryFn: async () => {
      // Quando o endpoint estiver disponível, usar:
      // const data = await fetchAPI('/customers/me/orders')
      // return data.orders as Order[]
      
      // Por enquanto, retorna vazio
      return [] as Order[]
    },
    enabled: isAuthenticated,
  })
}

export function useCustomerOrder(orderId: string) {
  const { accessToken, customer } = useAuthStore()
  const isAuthenticated = !!(accessToken && customer)

  return useQuery({
    queryKey: ['customer-order', orderId],
    queryFn: async () => {
      // TODO: Implementar endpoint GET /customers/me/orders/:id no backend
      // Por enquanto, retorna null
      return null as Order | null
    },
    enabled: isAuthenticated && !!orderId,
  })
}

