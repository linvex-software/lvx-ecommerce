import { create } from 'zustand'

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
    couponCode?: string | null
    shippingCost: number
    setFormData: (data: Partial<CheckoutFormData>) => void
    setCouponCode: (code: string | null) => void
    setShippingCost: (cost: number) => void
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
    couponCode: null,
    shippingCost: 0,
    setFormData: (data) =>
        set((state) => ({
            formData: { ...state.formData, ...data },
        })),
    setCouponCode: (code) => set({ couponCode: code }),
    setShippingCost: (cost) => set({ shippingCost: cost }),
    resetFormData: () => set({ formData: initialFormData, couponCode: null, shippingCost: 0 }),
}))
