import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../api-client'

export interface PhysicalSalesCartItem {
  product_id: string
  variant_id?: string | null
  quantity: number
  price: number
  discount?: number
}

export interface PhysicalSalesCart {
  id: string
  store_id: string
  seller_user_id: string
  customer_id: string | null
  status: 'active' | 'abandoned' | 'converted'
  items: PhysicalSalesCartItem[]
  total: string
  discount_amount: string
  coupon_code: string | null
  shipping_address: string | null
  origin: string | null
  commission_rate: string | null
  last_activity_at: string
  created_at: string
  updated_at: string
}

export interface CreateCartInput {
  items: PhysicalSalesCartItem[]
  customer_id?: string | null
  coupon_code?: string | null
  shipping_address?: string | null
  origin?: string | null
  commission_rate?: number | null
}

export function useCreatePdvCart() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateCartInput) => {
      const response = await apiClient.post<{ cart: PhysicalSalesCart }>(
        '/physical-sales/cart',
        input
      )
      return response.data.cart
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pdv-cart'] })
    }
  })
}

export function usePdvCart(cartId: string | null) {
  return useQuery({
    queryKey: ['pdv-cart', cartId],
    queryFn: async () => {
      if (!cartId) return null
      const response = await apiClient.get<{ cart: PhysicalSalesCart }>(
        `/physical-sales/cart/${cartId}`
      )
      return response.data.cart
    },
    enabled: !!cartId
  })
}

export function useActivePdvCart() {
  return useQuery({
    queryKey: ['pdv-cart', 'active'],
    queryFn: async () => {
      const response = await apiClient.get<{ cart: PhysicalSalesCart | null }>(
        '/physical-sales/cart/active'
      )
      return response.data.cart
    },
    refetchOnWindowFocus: false,
    staleTime: 30000 // 30 segundos
  })
}

export function useAddItemToPdvCart() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: {
      cart_id?: string // Opcional - backend criará se não existir
      product_id: string
      variant_id?: string | null
      quantity: number
      discount?: number
    }) => {
      const response = await apiClient.post<{ cart: PhysicalSalesCart }>(
        '/physical-sales/cart/add-item',
        input
      )
      return response.data.cart
    },
    onSuccess: (cart) => {
      // Invalidar todas as queries de carrinho para atualizar UI
      queryClient.invalidateQueries({ queryKey: ['pdv-cart'] })
      // Atualizar cache com o carrinho retornado
      queryClient.setQueryData(['pdv-cart', cart.id], cart)
      queryClient.setQueryData(['pdv-cart', 'active'], cart)
    }
  })
}

export function useRemoveItemFromPdvCart() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: {
      cart_id: string
      product_id: string
      variant_id?: string | null
    }) => {
      const response = await apiClient.post<{ cart: PhysicalSalesCart }>(
        '/physical-sales/cart/remove-item',
        input
      )
      return response.data.cart
    },
    onSuccess: (cart) => {
      // Invalidar todas as queries de carrinho
      queryClient.invalidateQueries({ queryKey: ['pdv-cart'] })
      // Atualizar cache com o carrinho retornado
      queryClient.setQueryData(['pdv-cart', cart.id], cart)
      queryClient.setQueryData(['pdv-cart', 'active'], cart)
    }
  })
}

export function useUpdateItemQuantity() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: {
      cart_id: string
      product_id: string
      variant_id?: string | null
      quantity: number
    }) => {
      const response = await apiClient.put<{ cart: PhysicalSalesCart }>(
        '/physical-sales/cart/update-quantity',
        input
      )
      return response.data.cart
    },
    onSuccess: (cart, variables) => {
      // Invalidar todas as queries de carrinho
      queryClient.invalidateQueries({ queryKey: ['pdv-cart'] })
      // Atualizar cache com o carrinho retornado
      queryClient.setQueryData(['pdv-cart', cart.id], cart)
      queryClient.setQueryData(['pdv-cart', 'active'], cart)
    }
  })
}

export function useApplyDiscount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: {
      cart_id: string
      coupon_code?: string | null
      discount_amount?: number
    }) => {
      const response = await apiClient.post<{ cart: PhysicalSalesCart }>(
        '/physical-sales/cart/apply-discount',
        input
      )
      return response.data.cart
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pdv-cart', variables.cart_id] })
    }
  })
}

export function useAssociateCustomer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: {
      cart_id: string
      customer_id: string | null
    }) => {
      const response = await apiClient.post<{ cart: PhysicalSalesCart }>(
        '/physical-sales/cart/associate-customer',
        input
      )
      return response.data.cart
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pdv-cart', variables.cart_id] })
    }
  })
}

export function useFinalizePdvSale() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: {
      cart_id: string
      origin?: string
      payment_method?: 'pix' | 'credit_card' | 'debit_card' | 'cash' | 'other'
      // commission_rate removido - será calculado pelo backend
      shipping_address?: {
        zip_code: string
        street?: string
        number?: string
        complement?: string
        neighborhood?: string
        city?: string
        state?: string
        country?: string
      } | null
    }) => {
      const response = await apiClient.post<{ order: any }>('/physical-sales/finalize', input)
      return response.data.order
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pdv-cart'] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    }
  })
}

export function useGeneratePaymentLink() {
  return useMutation({
    mutationFn: async (input: {
      order_id: string
      payment_method?: 'pix' | 'credit_card' | 'debit_card'
      payer?: {
        email: string
        firstName?: string
        lastName?: string
        identification?: {
          type: string
          number: string
        }
      }
    }) => {
      const response = await apiClient.post<{
        paymentUrl: string
        qrCode?: string
        qrCodeBase64?: string
        ticketUrl?: string
        transactionId: string
      }>('/physical-sales/generate-payment-link', input)
      return response.data
    }
  })
}

export function useUpdateCartOrigin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: { cart_id: string; origin: string }) => {
      const response = await apiClient.post<{ cart: PhysicalSalesCart }>(
        '/physical-sales/cart/set-origin',
        input
      )
      return response.data.cart
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pdv-cart', variables.cart_id] })
      queryClient.invalidateQueries({ queryKey: ['pdv-cart', 'active'] })
    }
  })
}

export function useUpdateCartSeller() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: { cart_id: string; seller_user_id: string }) => {
      const response = await apiClient.post<{ cart: PhysicalSalesCart }>(
        '/physical-sales/cart/set-seller',
        input
      )
      return response.data.cart
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pdv-cart', variables.cart_id] })
      queryClient.invalidateQueries({ queryKey: ['pdv-cart', 'active'] })
    }
  })
}

