'use client'

import { useEffect, useState } from 'react'
import { MercadoPagoPayment } from './MercadoPagoPayment'
import { fetchAPI } from '@/lib/api'

interface PaymentMethodProps {
  orderId?: string
  amount: number
  payer: {
    email: string
    firstName?: string
    lastName?: string
    identification?: {
      type: string
      number: string
    }
  }
  onPaymentSuccess: (result: PaymentResult) => void
  onPaymentError: (error: string) => void
  onCreateOrder?: () => Promise<{ id: string } | undefined>
  isCreatingOrder?: boolean
}

interface PaymentResult {
  transactionId: string
  status: string
  paymentResult: {
    id: string
    status: string
    statusDetail: string
    qrCode?: string
    qrCodeBase64?: string
    ticketUrl?: string
  }
}

/**
 * Componente wrapper que busca o gateway ativo e renderiza o componente correto
 */
export function PaymentMethod(props: PaymentMethodProps) {
  const [activeProvider, setActiveProvider] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchActiveGateway = async () => {
      try {
        setIsLoading(true)
        const response = await fetchAPI('/payments/active-gateway', { method: 'GET' })
        
        if (response?.provider) {
          setActiveProvider(response.provider as string)
        } else {
          setError('Nenhum método de pagamento ativo configurado')
        }
      } catch (err: any) {
        console.error('Erro ao buscar gateway ativo:', err)
        setError(err?.message || 'Erro ao buscar método de pagamento')
      } finally {
        setIsLoading(false)
      }
    }

    fetchActiveGateway()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-sm text-gray-500">Carregando método de pagamento...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-sm text-red-800">{error}</p>
      </div>
    )
  }

  // Renderizar componente baseado no provider ativo
  if (activeProvider === 'mercadopago') {
    return <MercadoPagoPayment {...props} />
  }

  if (activeProvider === 'stripe') {
    // TODO: Implementar StripePayment quando necessário
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">
          Stripe ainda não está implementado no frontend. Por favor, use Mercado Pago.
        </p>
      </div>
    )
  }

  return (
    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
      <p className="text-sm text-red-800">
        Método de pagamento "{activeProvider}" não suportado
      </p>
    </div>
  )
}
