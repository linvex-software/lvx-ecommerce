import { useState } from 'react'
import { useCartStore } from '@/lib/store/useCartStore'
import { useCheckoutStore } from '@/lib/store/useCheckoutStore'

export const useCheckout = () => {
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
    const [orderId, setOrderId] = useState<string>('')
    const [errorMessage, setErrorMessage] = useState<string>('')

    const { clearCart } = useCartStore()
    const { formData, resetFormData } = useCheckoutStore()

    const processCheckout = async () => {
        setStatus('loading')
        try {
            if (!formData.fullName || !formData.email || !formData.address) {
                throw new Error('Por favor, preencha todos os campos obrigatórios.')
            }

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 2000))

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

    const resetStatus = () => setStatus('idle')

    return {
        status,
        orderId,
        errorMessage,
        processCheckout,
        resetStatus
    }
}
