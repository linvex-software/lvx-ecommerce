import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { Product } from '@/components/ProductCard'

export interface CartItem extends Product {
    quantity: number
    variant_id?: string | null
}

interface CartState {
    items: CartItem[]
    isOpen: boolean
    addItem: (product: Product, variantId?: string | null) => void
    removeItem: (id: number | string) => void
    updateQuantity: (id: number | string, quantity: number) => void
    clearCart: () => void
    openCart: () => void
    closeCart: () => void
}

export const useCartStore = create<CartState>()(
    persist(
        (set) => ({
            items: [],
            isOpen: false,
            addItem: (product, variantId) => {
                set((state) => {
                    const existing = state.items.find(
                        (item) => item.id === product.id && item.variant_id === variantId
                    )
                    if (existing) {
                        return {
                            items: state.items.map((item) =>
                                item.id === product.id && item.variant_id === variantId
                                    ? { ...item, quantity: item.quantity + 1 }
                                    : item
                            ),
                        }
                    }
                    return {
                        items: [...state.items, { ...product, quantity: 1, variant_id: variantId ?? null }]
                    }
                })
            },
            removeItem: (id) => {
                set((state) => ({
                    items: state.items.filter((item) => item.id !== id),
                }))
            },
            updateQuantity: (id, quantity) => {
                set((state) => ({
                    items: state.items.map((item) =>
                        item.id === id ? { ...item, quantity } : item
                    ),
                }))
            },
            clearCart: () => set({ items: [] }),
            openCart: () => set({ isOpen: true }),
            closeCart: () => set({ isOpen: false }),
        }),
        {
            name: 'cart-storage',
            storage: createJSONStorage(() => localStorage),
        }
    )
)
