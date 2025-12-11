'use client'

import { useState } from 'react'
import { ArrowLeft, Check } from 'lucide-react'
import { Button } from '@white-label/ui'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useActivePdvCart, useFinalizePdvSale } from '@/lib/hooks/use-pdv-cart'
import toast from 'react-hot-toast'

interface PaymentViewProps {
  onBack: () => void
  onComplete: (orderId: string) => void
}

type PaymentMethod = 'pix' | 'credit_card' | 'debit_card' | 'cash'
type PaymentStatus = 'now' | 'pending' | 'on_delivery'

export function PaymentView({ onBack, onComplete }: PaymentViewProps) {
  const { data: cart } = useActivePdvCart()
  const finalizeSale = useFinalizePdvSale()

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix')
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('now')

  const formatCurrency = (cents: number | string) => {
    const value = typeof cents === 'string' ? parseFloat(cents) : cents
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value / 100)
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <p className="text-lg mb-2">Carrinho vazio</p>
        <Button variant="outline" onClick={onBack}>
          Voltar ao carrinho
        </Button>
      </div>
    )
  }

  const subtotal = cart.items.reduce((sum, item) => {
    const itemTotal = item.price * item.quantity
    const itemDiscount = item.discount ?? 0
    return sum + itemTotal - itemDiscount
  }, 0)

  const discount = parseFloat(cart.discount_amount) || 0
  const total = Math.max(0, subtotal - discount)

  const handleRegisterSale = async () => {
    if (!cart.id) {
      toast.error('Carrinho não encontrado')
      return
    }

    try {
      const order = await finalizeSale.mutateAsync({
        cart_id: cart.id,
        origin: cart.origin || 'pdv'
      })

      toast.success('Venda registrada com sucesso!')
      onComplete(order.id)
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao registrar venda')
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack} size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar ao carrinho
        </Button>
        <h2 className="text-2xl font-bold text-gray-900">Pagamento</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Método de Pagamento */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Método de pagamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <button
                onClick={() => setPaymentMethod('pix')}
                className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                  paymentMethod === 'pix'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">PIX</p>
                    <p className="text-sm text-gray-600">Pagamento instantâneo</p>
                  </div>
                  {paymentMethod === 'pix' && (
                    <Check className="h-5 w-5 text-blue-600" />
                  )}
                </div>
              </button>

              <button
                onClick={() => setPaymentMethod('credit_card')}
                className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                  paymentMethod === 'credit_card'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">Cartão de Crédito</p>
                    <p className="text-sm text-gray-600">Parcelamento disponível</p>
                  </div>
                  {paymentMethod === 'credit_card' && (
                    <Check className="h-5 w-5 text-blue-600" />
                  )}
                </div>
              </button>

              <button
                onClick={() => setPaymentMethod('debit_card')}
                className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                  paymentMethod === 'debit_card'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">Cartão de Débito</p>
                    <p className="text-sm text-gray-600">Débito em conta</p>
                  </div>
                  {paymentMethod === 'debit_card' && (
                    <Check className="h-5 w-5 text-blue-600" />
                  )}
                </div>
              </button>

              <button
                onClick={() => setPaymentMethod('cash')}
                className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                  paymentMethod === 'cash'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">Dinheiro</p>
                    <p className="text-sm text-gray-600">Pagamento em espécie</p>
                  </div>
                  {paymentMethod === 'cash' && (
                    <Check className="h-5 w-5 text-blue-600" />
                  )}
                </div>
              </button>
            </CardContent>
          </Card>

          {/* Status do Pagamento */}
          <Card>
            <CardHeader>
              <CardTitle>Registrar pagamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <button
                onClick={() => setPaymentStatus('now')}
                className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                  paymentStatus === 'now'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">Registrar pagamento agora</p>
                    <p className="text-sm text-gray-600">Pagamento confirmado imediatamente</p>
                  </div>
                  {paymentStatus === 'now' && (
                    <Check className="h-5 w-5 text-blue-600" />
                  )}
                </div>
              </button>

              <button
                onClick={() => setPaymentStatus('pending')}
                className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                  paymentStatus === 'pending'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">Registrar como pendente</p>
                    <p className="text-sm text-gray-600">Aguardando confirmação</p>
                  </div>
                  {paymentStatus === 'pending' && (
                    <Check className="h-5 w-5 text-blue-600" />
                  )}
                </div>
              </button>

              <button
                onClick={() => setPaymentStatus('on_delivery')}
                className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                  paymentStatus === 'on_delivery'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">Registrar quando entregue</p>
                    <p className="text-sm text-gray-600">Pagamento na entrega</p>
                  </div>
                  {paymentStatus === 'on_delivery' && (
                    <Check className="h-5 w-5 text-blue-600" />
                  )}
                </div>
              </button>
            </CardContent>
          </Card>
        </div>

        {/* Resumo */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Resumo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">{formatCurrency(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-red-600">
                    <span>Desconto</span>
                    <span>-{formatCurrency(discount)}</span>
                  </div>
                )}
                <div className="border-t border-gray-200 pt-2 mt-2">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-gray-900">{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleRegisterSale}
                disabled={finalizeSale.isPending}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-base font-semibold"
                size="lg"
              >
                {finalizeSale.isPending ? 'Registrando...' : 'Registrar venda'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

