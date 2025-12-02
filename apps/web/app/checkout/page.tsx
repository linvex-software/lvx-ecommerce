'use client'

import { useState } from 'react'
import CheckoutForm from '@/components/checkout/CheckoutForm'
import OrderSummary from '@/components/checkout/OrderSummary'
import PaymentMethod from '@/components/checkout/PaymentMethod'
import { DeliveryOptions } from '@/components/checkout/DeliveryOptions'
import CheckoutSuccess from '@/components/checkout/CheckoutSuccess'
import CheckoutError from '@/components/checkout/CheckoutError'
import { useCartStore } from '@/lib/store/useCartStore'
import { useCheckoutStore } from '@/lib/store/useCheckoutStore'
import { useCreateOrder } from '@/lib/hooks/use-create-order'
import Navbar from '@/components/Navbar'

interface SelectedDeliveryOption {
  type: 'shipping' | 'pickup_point'
  id: string
}

export default function CheckoutPage() {
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
    const [orderId, setOrderId] = useState<string>('')
    const [errorMessage, setErrorMessage] = useState<string>('')
    const [selectedDeliveryOption, setSelectedDeliveryOption] = useState<SelectedDeliveryOption | null>(null)

    const { items, clearCart } = useCartStore()
    const { formData, resetFormData, shippingCost, couponCode } = useCheckoutStore()
    const { createOrder, isLoading: isCreatingOrder } = useCreateOrder()

    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)

    const handleCheckout = async () => {
        setStatus('loading')

        try {
            // Validate form data
            if (!formData.fullName || !formData.email || !formData.address) {
                throw new Error('Por favor, preencha todos os campos obrigatórios.')
            }

            if (items.length === 0) {
                throw new Error('Seu carrinho está vazio.')
            }

            // Validar seleção de entrega
            if (!selectedDeliveryOption) {
                throw new Error('Selecione uma opção de frete ou retirada para continuar.')
            }

            // Converter itens do carrinho para formato da API
            // Preço está em reais (ex: 100.00), precisa converter para centavos (10000)
            const orderItems = items.map((item) => ({
                product_id: String(item.id),
                variant_id: item.variant_id ?? null,
                quantity: item.quantity,
                price: Math.round(item.price * 100) // converter para centavos
            }))

            // 2. Preparar endereço de entrega (apenas se for shipping)
            const shippingAddress =
                selectedDeliveryOption.type === 'shipping' && formData.zipCode
                    ? {
                          zip_code: formData.zipCode.replace(/\D/g, ''),
                          street: formData.address,
                          number: formData.number,
                          complement: formData.complement || undefined,
                          neighborhood: formData.neighborhood,
                          city: formData.city,
                          state: formData.state,
                          country: 'BR'
                      }
                    : null

            // 3. Criar pedido via API
            const order = await createOrder({
                items: orderItems,
                shipping_cost: Math.round((shippingCost || 0) * 100), // converter para centavos (será recalculado pelo backend)
                delivery_type: selectedDeliveryOption.type,
                delivery_option_id: selectedDeliveryOption.id,
                coupon_code: couponCode || null,
                shipping_address: shippingAddress
                // customer_id será criado/vinculado no backend se necessário
            })

            setOrderId(order.id)
            setStatus('success')
            clearCart()
            resetFormData()
            setSelectedDeliveryOption(null)
        } catch (error) {
            setStatus('error')
            setErrorMessage(error instanceof Error ? error.message : 'Ocorreu um erro ao processar seu pedido.')
        }
    }

    if (status === 'success') {
        return (
            <div className="min-h-screen bg-background">
                <Navbar cartCount={0} onCartClick={() => { }} />
                <main className="container mx-auto px-4 py-12">
                    <CheckoutSuccess orderId={orderId} />
                </main>
            </div>
        )
    }

    if (status === 'error') {
        return (
            <div className="min-h-screen bg-background">
                <Navbar cartCount={totalItems} onCartClick={() => { }} />
                <main className="container mx-auto px-4 py-12">
                    <CheckoutError message={errorMessage} onRetry={() => setStatus('idle')} />
                </main>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background">
            <Navbar cartCount={totalItems} onCartClick={() => { }} />

            <main className="container mx-auto px-4 py-12">
                <h1 className="text-4xl font-bold mb-8">Finalizar Compra</h1>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <CheckoutForm />
                        <DeliveryOptions
                            onSelectionChange={(option) => {
                                if (option) {
                                    setSelectedDeliveryOption({
                                        type: option.type,
                                        id: option.id
                                    })
                                } else {
                                    setSelectedDeliveryOption(null)
                                }
                            }}
                        />
                        <PaymentMethod />
                    </div>

                    <div className="lg:col-span-1">
                        <OrderSummary
                            onCheckout={handleCheckout}
                            isLoading={status === 'loading' || isCreatingOrder}
                            isDeliverySelected={selectedDeliveryOption !== null}
                        />
                    </div>
                </div>
            </main>
        </div>
    )
}
