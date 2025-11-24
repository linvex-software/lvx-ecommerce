import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type PaymentMethod = 'pix' | 'card'

export interface CheckoutFormData {
    fullName: string
    email: string
    cpf: string
    phone: string
    zipCode: string
    address: string
    number: string
    complement: string
    neighborhood: string
    city: string
    state: string
    paymentMethod: PaymentMethod
}

interface CheckoutState {
    formData: CheckoutFormData
    setFormData: (data: Partial<CheckoutFormData>) => void
    resetFormData: () => void
}

const initialFormData: CheckoutFormData = {
    fullName: '',
    email: '',
    cpf: '',
    phone: '',
    zipCode: '',
    address: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    paymentMethod: 'pix',
}

export const useCheckoutStore = create<CheckoutState>()((set) => ({
    formData: initialFormData,
    setFormData: (data) =>
        set((state) => ({
            formData: { ...state.formData, ...data },
        })),
    resetFormData: () => set({ formData: initialFormData }),
}))
