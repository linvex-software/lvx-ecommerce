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
    removeItem: (id: number | string, variantId?: string | null) => void
    updateQuantity: (id: number | string, quantity: number, variantId?: string | null) => void
    clearCart: () => void
    openCart: () => void
    closeCart: () => void
    setSessionId: (sessionId: string) => void
    setCartId: (cartId: string) => void
    markSynced: (cartId: string, syncedAt: string) => void
    setSyncError: (error: boolean) => void
    hydrateFromRemote: (cart: any) => void
}

// Função auxiliar para normalizar variant_id (null e undefined são tratados como o mesmo)
const normalizeVariantId = (variantId: string | null | undefined): string | null => {
    return variantId ?? null
}

// Função auxiliar para comparar se dois items são iguais
const itemsMatch = (item1: CartItem, itemId: number | string, variantId?: string | null): boolean => {
    const normalizedVariantId = normalizeVariantId(variantId)
    return item1.id === itemId && normalizeVariantId(item1.variant_id) === normalizedVariantId
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
                    const normalizedVariantId = normalizeVariantId(variantId)
                    const existing = state.items.find(
                        (item) => itemsMatch(item, product.id, normalizedVariantId)
                    )
                    if (existing) {
                        return {
                            items: state.items.map((item) =>
                                itemsMatch(item, product.id, normalizedVariantId)
                                    ? { ...item, quantity: item.quantity + 1 }
                                    : item
                            ),
                        }
                    }
                    return {
                        items: [...state.items, { ...product, quantity: 1, variant_id: normalizedVariantId }]
                    }
                })
            },
            removeItem: (id, variantId) => {
                set((state) => {
                    const normalizedVariantId = normalizeVariantId(variantId)
                    return {
                        items: state.items.filter((item) => !itemsMatch(item, id, normalizedVariantId)),
                    }
                })
            },
            updateQuantity: (id, quantity, variantId) => {
                set((state) => {
                    const normalizedVariantId = normalizeVariantId(variantId)
                    // Se quantidade <= 0, remover o item
                    if (quantity <= 0) {
                        return {
                            items: state.items.filter((item) => !itemsMatch(item, id, normalizedVariantId)),
                        }
                    }
                    return {
                        items: state.items.map((item) =>
                            itemsMatch(item, id, normalizedVariantId) ? { ...item, quantity } : item
                        ),
                    }
                })
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
