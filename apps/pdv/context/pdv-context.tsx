'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import type { Customer } from '@/lib/hooks/use-customers'
import type { PhysicalSalesCart } from '@/lib/hooks/use-pdv-cart'
import { apiClient } from '@/lib/api-client'

export type PDVStep = 'client' | 'vendor' | 'products' | 'payment' | 'receipt'

export type PaymentMethod = 'pix' | 'credit_card' | 'debit_card' | 'cash' | 'other'

interface PDVState {
  // Etapa atual
  currentStep: PDVStep

  // Dados da venda
  customer: Customer | null
  vendorId: string | null
  vendorName: string | null
  origin: string

  // Carrinho
  cartId: string | null
  cart: PhysicalSalesCart | null

  // Pagamento
  paymentMethod: PaymentMethod | null

  // Pedido finalizado
  orderId: string | null
}

interface PDVContextType {
  state: PDVState
  setCustomer: (customer: Customer | null) => void
  setVendor: (vendorId: string, vendorName: string) => void
  setOrigin: (origin: string) => void
  setCart: (cart: PhysicalSalesCart | null) => void
  setCartId: (cartId: string | null) => void
  loadCart: (cartId: string) => Promise<void>
  clearCart: () => void
  createCartIfNotExists: () => Promise<string | null>
  setPaymentMethod: (method: PaymentMethod) => void
  setCurrentStep: (step: PDVStep) => void
  setOrderId: (orderId: string | null) => void
  reset: () => void
}

const initialState: PDVState = {
  currentStep: 'client',
  customer: null,
  vendorId: null,
  vendorName: null,
  origin: 'pdv',
  cartId: null,
  cart: null,
  paymentMethod: null,
  orderId: null
}

const PDVContext = createContext<PDVContextType | undefined>(undefined)

export function PDVProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PDVState>(initialState)

  const setCustomer = useCallback((customer: Customer | null) => {
    setState((prev) => {
      if (prev.customer?.id === customer?.id) return prev
      return { ...prev, customer }
    })
  }, [])

  const setVendor = useCallback((vendorId: string, vendorName: string) => {
    setState((prev) => {
      if (prev.vendorId === vendorId) return prev
      return { ...prev, vendorId, vendorName }
    })
  }, [])

  const setOrigin = useCallback((origin: string) => {
    setState((prev) => {
      if (prev.origin === origin) return prev
      return { ...prev, origin }
    })
  }, [])

  const setCartId = useCallback((cartId: string | null) => {
    setState((prev) => {
      if (prev.cartId === cartId) return prev
      return { ...prev, cartId }
    })
  }, [])

  const setCart = useCallback((cart: PhysicalSalesCart | null) => {
    setState((prev) => {
      // Atualizar cartId também quando cart mudar
      const newCartId = cart?.id || null
      if (prev.cart?.id === cart?.id && prev.cartId === newCartId) return prev
      return { ...prev, cart, cartId: newCartId }
    })
  }, [])

  const loadCart = useCallback(async (cartId: string) => {
    try {
      const response = await apiClient.get<{ cart: PhysicalSalesCart }>(
        `/physical-sales/cart/${cartId}`
      )
      setCart(response.data.cart)
      setCartId(cartId)
    } catch (error) {
      console.error('Erro ao carregar carrinho:', error)
      throw error
    }
  }, [setCart, setCartId])

  const clearCart = useCallback(() => {
    setState((prev) => ({ ...prev, cartId: null, cart: null }))
  }, [])

  const createCartIfNotExists = useCallback(async (): Promise<string | null> => {
    // Se já tem cartId, retornar
    if (state.cartId) {
      return state.cartId
    }

    // Se não tem cliente ou vendedor, não criar carrinho
    if (!state.customer || !state.vendorId) {
      console.error('Erro: cliente ou vendedor não selecionado', {
        customer: state.customer,
        vendorId: state.vendorId
      })
      return null
    }

    try {
      console.log('🛒 Iniciando criação de carrinho...', {
        customer: state.customer?.id,
        vendorId: state.vendorId,
        origin: state.origin
      })

      // Criar carrinho vazio (backend espera apenas items)
      // O schema Zod aceita items vazio, coupon_code e shipping_address são opcionais
      const payload: {
        items: Array<never>
        coupon_code?: string | null
        shipping_address?: string | null
      } = {
        items: [] // Carrinho vazio inicialmente
      }

      console.log('📤 Enviando POST /physical-sales/cart')
      console.log('📤 Payload:', JSON.stringify(payload, null, 2))

      // Verificar token
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('accessToken')
        console.log('📤 Token presente:', token ? 'Sim (***)' : 'Não')
      }

      const response = await apiClient.post<{ cart: PhysicalSalesCart }>(
        '/physical-sales/cart',
        payload
      )

      console.log('📥 Resposta recebida:', {
        status: response.status,
        data: response.data
      })

      console.log('✅ Carrinho criado:', response.data.cart.id)
      const cart = response.data.cart

      // IMPORTANTE: Ordem das associações
      // 1. Associar origem PRIMEIRO (antes de mudar o vendedor)
      //    porque setCartOrigin verifica se o carrinho pertence ao usuário logado
      let updatedCart = cart

      try {
        console.log('📤 Associando origem...', { cart_id: cart.id, origin: state.origin || 'pdv' })
        const originResponse = await apiClient.post<{ cart: PhysicalSalesCart }>(`/physical-sales/cart/set-origin`, {
          cart_id: cart.id,
          origin: state.origin || 'pdv'
        })
        updatedCart = originResponse.data.cart
        console.log('✅ Origem associada')
      } catch (originError: any) {
        console.error('❌ Erro ao associar origem:', originError.response?.data || originError)
        throw new Error(`Erro ao associar origem: ${originError.response?.data?.error || originError.message}`)
      }

      // 2. Associar cliente ao carrinho
      if (state.customer.id) {
        try {
          console.log('📤 Associando cliente...', { cart_id: updatedCart.id, customer_id: state.customer.id })
          const customerResponse = await apiClient.post<{ cart: PhysicalSalesCart }>(`/physical-sales/cart/associate-customer`, {
            cart_id: updatedCart.id,
            customer_id: state.customer.id
          })
          updatedCart = customerResponse.data.cart
          console.log('✅ Cliente associado')
        } catch (customerError: any) {
          console.error('❌ Erro ao associar cliente:', customerError.response?.data || customerError)
          throw new Error(`Erro ao associar cliente: ${customerError.response?.data?.error || customerError.message}`)
        }
      }

      // 3. Associar vendedor ao carrinho POR ÚLTIMO
      //    (depois de associar origem, porque setCartOrigin precisa que o carrinho pertença ao usuário logado)
      try {
        console.log('📤 Associando vendedor...', { cart_id: updatedCart.id, seller_user_id: state.vendorId })
        const sellerResponse = await apiClient.post<{ cart: PhysicalSalesCart }>(`/physical-sales/cart/set-seller`, {
          cart_id: updatedCart.id,
          seller_user_id: state.vendorId
        })
        updatedCart = sellerResponse.data.cart
        console.log('✅ Vendedor associado')
      } catch (sellerError: any) {
        console.error('❌ Erro ao associar vendedor:', sellerError.response?.data || sellerError)
        throw new Error(`Erro ao associar vendedor: ${sellerError.response?.data?.error || sellerError.message}`)
      }

      // Usar o carrinho atualizado das associações (não precisa recarregar)
      console.log('✅ Carrinho final:', updatedCart)

      // Atualizar estado
      setCart(updatedCart)
      setCartId(updatedCart.id)

      return updatedCart.id
    } catch (error: any) {
      // Log detalhado do erro
      console.error('❌ Erro ao criar carrinho:')
      console.error('  - Status:', error.response?.status)
      console.error('  - Status Text:', error.response?.statusText)
      console.error('  - Data:', error.response?.data)
      console.error('  - Message:', error.message)
      console.error('  - URL:', error.config?.url)
      console.error('  - Method:', error.config?.method)
      console.error('  - Request:', error.config?.data)
      console.error('  - Headers:', error.config?.headers)
      console.error('  - Error completo:', error)

      console.error('📋 Estado atual:', {
        customer: state.customer,
        vendorId: state.vendorId,
        origin: state.origin,
        cartId: state.cartId
      })

      return null
    }
  }, [state.customer, state.vendorId, state.origin, state.cartId, setCart, setCartId])

  const setPaymentMethod = useCallback((method: PaymentMethod) => {
    setState((prev) => {
      if (prev.paymentMethod === method) return prev
      return { ...prev, paymentMethod: method }
    })
  }, [])

  const setCurrentStep = useCallback((step: PDVStep) => {
    setState((prev) => {
      if (prev.currentStep === step) return prev
      return { ...prev, currentStep: step }
    })
  }, [])

  const setOrderId = useCallback((orderId: string | null) => {
    setState((prev) => {
      if (prev.orderId === orderId) return prev
      return { ...prev, orderId }
    })
  }, [])

  const reset = useCallback(() => {
    setState(initialState)
  }, [])

  return (
    <PDVContext.Provider
      value={{
        state,
        setCustomer,
        setVendor,
        setOrigin,
        setCart,
        setCartId,
        loadCart,
        clearCart,
        createCartIfNotExists,
        setPaymentMethod,
        setCurrentStep,
        setOrderId,
        reset
      }}
    >
      {children}
    </PDVContext.Provider>
  )
}

export function usePDV() {
  const context = useContext(PDVContext)
  if (context === undefined) {
    throw new Error('usePDV must be used within a PDVProvider')
  }
  return context
}
