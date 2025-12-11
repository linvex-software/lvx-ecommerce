'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Check } from 'lucide-react'
import { Button } from '@white-label/ui'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StepProgress } from '@/components/pdv/step-progress'
import { usePDV } from '@/context/pdv-context'
import { usePdvCart, useFinalizePdvSale } from '@/lib/hooks/use-pdv-cart'
import toast from 'react-hot-toast'

export default function PaymentStepPage() {
  const router = useRouter()
  const { state, setPaymentMethod, setCurrentStep, setOrderId } = usePDV()
  const { data: cart } = usePdvCart(state.cartId)
  const finalizeSale = useFinalizePdvSale()

  useEffect(() => {
    // Validar etapas anteriores
    if (!state.customer) {
      router.push('/pdv/client')
      return
    }
    if (!state.vendorId) {
      router.push('/pdv/vendor')
      return
    }
    if (!state.cartId) {
      router.push('/pdv/products')
      return
    }
    if (!state.cartId) {
      router.push('/pdv/products')
      return
    }
    if (!cart || cart.items.length === 0) {
      router.push('/pdv/products')
      return
    }
  }, [state.customer, state.vendorId, state.cartId, cart, router])

  const formatCurrency = (cents: number | string) => {
    const value = typeof cents === 'string' ? parseFloat(cents) : cents
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value / 100)
  }

  if (!cart || cart.items.length === 0) {
    return null
  }

  const subtotal = cart.items.reduce((sum, item) => {
    const itemTotal = item.price * item.quantity
    const itemDiscount = item.discount ?? 0
    return sum + itemTotal - itemDiscount
  }, 0)

  const discount = parseFloat(cart.discount_amount) || 0
  const total = Math.max(0, subtotal - discount)

  const handleRegisterSale = async () => {
    if (!state.cartId) {
      toast.error('Carrinho não encontrado')
      return
    }

    if (!state.paymentMethod) {
      toast.error('Selecione um método de pagamento')
      return
    }

    try {
      const order = await finalizeSale.mutateAsync({
        cart_id: state.cartId,
        origin: state.origin || 'pdv',
        payment_method: state.paymentMethod
      })

      toast.success('Venda registrada com sucesso!')
      // Atualizar estado antes de navegar
      setOrderId(order.id)
      setCurrentStep('receipt')
      // Usar setTimeout para garantir que o estado seja atualizado
      setTimeout(() => {
        router.push('/pdv/receipt')
      }, 100)
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao registrar venda')
    }
  }

  const paymentMethods = [
    { id: 'pix' as const, label: 'PIX', description: 'Pagamento instantâneo' },
    { id: 'credit_card' as const, label: 'Cartão de Crédito', description: 'Parcelamento disponível' },
    { id: 'debit_card' as const, label: 'Cartão de Débito', description: 'Débito em conta' },
    { id: 'cash' as const, label: 'Dinheiro', description: 'Pagamento em espécie' },
    { id: 'other' as const, label: 'Outro', description: 'Outro método de pagamento' }
  ]

  return (
    <div className="w-full max-w-4xl mx-auto">
      <StepProgress currentStep="payment" />

      <div className="p-4 md:p-8">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">Pagamento</h1>
          <p className="text-gray-600 dark:text-gray-400">Selecione o método de pagamento</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Métodos de Pagamento */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="shadow-sm border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">Método de pagamento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id)}
                    className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                      state.paymentMethod === method.id
                        ? 'border-blue-600 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{method.label}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{method.description}</p>
                      </div>
                      {state.paymentMethod === method.id && (
                        <Check className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      )}
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Resumo */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4 shadow-lg border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">Resumo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                    <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(subtotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm text-red-600 dark:text-red-400">
                      <span>Desconto</span>
                      <span>-{formatCurrency(discount)}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
                    <div className="flex justify-between text-lg font-bold">
                      <span className="text-gray-900 dark:text-white">Total</span>
                      <span className="text-gray-900 dark:text-white">{formatCurrency(total)}</span>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleRegisterSale}
                  disabled={finalizeSale.isPending || !state.paymentMethod}
                  className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
                  size="lg"
                >
                  {finalizeSale.isPending ? 'Registrando...' : 'Finalizar Venda'}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => router.push('/pdv/products')}
                  className="w-full"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

