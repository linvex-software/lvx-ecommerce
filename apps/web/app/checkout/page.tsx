'use client'

import { useState } from 'react'
import CheckoutForm from '@/components/checkout/CheckoutForm'
import OrderSummary from '@/components/checkout/OrderSummary'
import PaymentMethod from '@/components/checkout/PaymentMethod'
import CheckoutSuccess from '@/components/checkout/CheckoutSuccess'
import CheckoutError from '@/components/checkout/CheckoutError'
import { useCartStore } from '@/lib/store/useCartStore'
import { useCheckoutStore } from '@/lib/store/useCheckoutStore'
import Navbar from '@/components/Navbar'

export default function CheckoutPage() {
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
    const [orderId, setOrderId] = useState<string>('')
    const [errorMessage, setErrorMessage] = useState<string>('')

    const { items, clearCart } = useCartStore()
    const { formData, resetFormData } = useCheckoutStore()

    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)

    const handleCheckout = async () => {
        setStatus('loading')

        // Simulate API call
        try {
            // Validate form data (basic check)
            if (!formData.fullName || !formData.email || !formData.address) {
                throw new Error('Por favor, preencha todos os campos obrigatórios.')
            }

            // Mock API delay
            await new Promise(resolve => setTimeout(resolve, 2000))

            // Mock success
            const newOrderId = Math.random().toString(36).substring(7).toUpperCase()
            setOrderId(newOrderId)
            setStatus('success')
            clearCart()
            resetFormData()
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
                        <PaymentMethod />
                    </div>

                    <div className="lg:col-span-1">
                        <OrderSummary onCheckout={handleCheckout} isLoading={status === 'loading'} />
                    </div>
                </div>
            </main>
        </div>
    )
}
