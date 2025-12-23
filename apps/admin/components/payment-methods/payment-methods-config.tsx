'use client'

import { useState, useEffect } from 'react'
import { usePaymentMethods, useUpdatePaymentMethod } from '@/lib/hooks/use-payment-methods'
import { MercadoPagoConfig } from './mercado-pago-config'
import { StripeConfig } from './stripe-config'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { CheckCircle2 } from 'lucide-react'

/**
 * Componente que gerencia múltiplos gateways de pagamento usando Tabs
 * Garante que apenas um gateway esteja ativo por vez
 */
export function PaymentMethodsConfig() {
  const { data: paymentMethods, isLoading } = usePaymentMethods()
  const updatePaymentMethod = useUpdatePaymentMethod()
  const [activeTab, setActiveTab] = useState<string>('mercadopago')

  // Quando um gateway é ativado, desativar os outros
  const handleToggleActive = async (provider: string, newActiveState: boolean) => {
    if (!newActiveState) {
      // Se está desativando, apenas retorna (já foi desativado no componente filho)
      return
    }

    // Se está ativando, primeiro desativa todos os outros
    try {
      const otherMethods = paymentMethods?.filter((pm) => pm.provider !== provider && pm.active) || []
      
      // Desativar todos os outros gateways primeiro
      if (otherMethods.length > 0) {
        await Promise.all(
          otherMethods.map((method) =>
            updatePaymentMethod.mutateAsync({
              id: method.id,
              data: { active: false }
            })
          )
        )
      }
    } catch (error) {
      console.error('Erro ao desativar outros gateways:', error)
    }
  }

  // Definir tab inicial baseado no gateway ativo
  useEffect(() => {
    if (paymentMethods && !isLoading) {
      const activeProvider = paymentMethods.find((pm) => pm.active)?.provider
      if (activeProvider) {
        setActiveTab(activeProvider)
      }
    }
  }, [paymentMethods, isLoading])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-sm text-gray-500">Carregando métodos de pagamento...</div>
      </div>
    )
  }

  const mercadoPagoMethod = paymentMethods?.find((pm) => pm.provider === 'mercadopago')
  const stripeMethod = paymentMethods?.find((pm) => pm.provider === 'stripe')
  const isMercadoPagoActive = mercadoPagoMethod?.active || false
  const isStripeActive = stripeMethod?.active || false

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Gateways de Pagamento</h3>
        <p className="text-sm text-gray-600">
          Configure e ative um gateway de pagamento. Apenas um gateway pode estar ativo por vez.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger 
            value="mercadopago" 
            className="flex items-center justify-center gap-2 relative"
          >
            <span>Mercado Pago</span>
            {isMercadoPagoActive && (
              <span className="inline-flex items-center gap-1 ml-1 text-xs font-medium text-green-600">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Ativo
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger 
            value="stripe" 
            className="flex items-center justify-center gap-2"
          >
            <span>Stripe</span>
            {isStripeActive && (
              <span className="inline-flex items-center gap-1 ml-1 text-xs font-medium text-green-600">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Ativo
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="mercadopago" className="mt-0">
          <MercadoPagoConfig onActiveChange={(active) => handleToggleActive('mercadopago', active)} />
        </TabsContent>

        <TabsContent value="stripe" className="mt-0">
          <StripeConfig onActiveChange={(active) => handleToggleActive('stripe', active)} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
