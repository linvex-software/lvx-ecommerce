import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { Product } from '@/components/ProductCard'

export interface CartItem extends Product {
    quantity: number
    variant_id?: string | null
}

interface RemoteCart {
    id: string
    items: Array<{
        product_id: string
        variant_id?: string | null
        quantity: number
        price: number
    }>
    total: string
    coupon_code?: string | null
}

interface CartState {
    items: CartItem[]
    isOpen: boolean
    cartId?: string | null
    sessionId?: string | null
    lastSyncedAt?: string | null
    hasSyncError?: boolean
    addItem: (product: Product, variantId?: string | null) => void
    removeItem: (id: number | string) => void
    updateQuantity: (id: number | string, quantity: number) => void
    clearCart: () => void
    openCart: () => void
    closeCart: () => void
    hydrateFromRemote: (cart: RemoteCart) => void
    markSynced: (cartId: string, timestamp: string) => void
    setSessionId: (sessionId: string) => void
    setSyncError: (hasError: boolean) => void
}

export const useCartStore = create<CartState>()(
    persist(
        (set) => ({
            items: [],
            isOpen: false,
            cartId: null,
            sessionId: null,
            lastSyncedAt: null,
            hasSyncError: false,
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
            clearCart: () => set({ items: [], cartId: null, lastSyncedAt: null, hasSyncError: false }),
            openCart: () => set({ isOpen: true }),
            closeCart: () => set({ isOpen: false }),
            hydrateFromRemote: (cart) => {
                // Converte itens do backend para formato do frontend
                // Nota: Precisamos buscar dados completos do produto (nome, imagem, etc)
                // Por enquanto, mantemos apenas os IDs e preços
                const items: CartItem[] = cart.items.map((item) => ({
                    id: item.product_id,
                    name: '', // Será preenchido quando buscar produtos
                    price: item.price,
                    image: '',
                    category: '',
                    quantity: item.quantity,
                    variant_id: item.variant_id ?? null
                }))
                set({
                    items,
                    cartId: cart.id,
                    lastSyncedAt: new Date().toISOString()
                })
            },
            markSynced: (cartId, timestamp) => {
                set({ cartId, lastSyncedAt: timestamp })
            },
            setSessionId: (sessionId) => {
                set({ sessionId })
            },
            setSyncError: (hasError) => {
                set({ hasSyncError: hasError })
            }
        }),
        {
            name: 'cart-storage',
            storage: createJSONStorage(() => localStorage),
        }
    )
)
