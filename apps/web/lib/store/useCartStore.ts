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
    cartId: string | null
    sessionId: string | null
    lastSyncedAt: string | null
    syncError: boolean
    addItem: (product: Product, variantId?: string | null) => void
    removeItem: (id: number | string) => void
    updateQuantity: (id: number | string, quantity: number) => void
    clearCart: () => void
    openCart: () => void
    closeCart: () => void
    setSessionId: (sessionId: string) => void
    setCartId: (cartId: string) => void
    markSynced: (cartId: string, syncedAt: string) => void
    setSyncError: (error: boolean) => void
    hydrateFromRemote: (cart: any) => void
}

export const useCartStore = create<CartState>()(
    persist(
        (set) => ({
            items: [],
            isOpen: false,
            cartId: null,
            sessionId: null,
            lastSyncedAt: null,
            syncError: false,
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
            setSessionId: (sessionId: string) => set({ sessionId }),
            setCartId: (cartId: string) => set({ cartId }),
            markSynced: (cartId: string, syncedAt: string) => set({ cartId, lastSyncedAt: syncedAt }),
            setSyncError: (error: boolean) => set({ syncError: error }),
            hydrateFromRemote: (cart: any) => {
                set({
                    cartId: cart.id,
                    items: cart.items?.map((item: any) => ({
                        id: item.product_id,
                        name: item.product?.name || '',
                        price: item.price,
                        image: item.product?.main_image || '',
                        category: item.product?.category_name || '',
                        quantity: item.quantity,
                        variant_id: item.variant_id ?? null,
                        description: item.product?.description || ''
                    })) || [],
                    lastSyncedAt: new Date().toISOString()
                })
            },
        }),
        {
            name: 'cart-storage',
            storage: createJSONStorage(() => localStorage),
        }
    )
)
