'use client'

/**
 * Provider mock do carrinho para o editor
 * 
 * Fornece um contexto de carrinho vazio para que os componentes do template
 * funcionem no editor sem depender do store real.
 * 
 * Este provider usa a mesma interface do CartContext do template para que
 * os componentes funcionem sem modificações.
 */

import React, { createContext, useContext, useCallback, useState, useMemo } from 'react'

interface CartItem {
  product: {
    id: string
    name: string
    price: number
    images: string[]
    category: string
    sizes: string[]
    colors: Array<{ name: string; hex: string }>
    description: string
  }
  quantity: number
  size: string
  color: string
}

interface CartContextType {
  items: CartItem[]
  addItem: (product: any, size: string, color: string, quantity?: number) => void
  removeItem: (productId: string, size: string, color: string) => void
  updateQuantity: (productId: string, size: string, color: string, quantity: number) => void
  clearCart: () => void
  itemCount: number
  total: number
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}

// Usar o mesmo nome de contexto que o template espera
// Isso permite que componentes do template usem o contexto do editor
const CartContext = createContext<CartContextType | undefined>(undefined)

// Exportar o contexto para que possa ser usado por outros módulos se necessário
export { CartContext }

export function EditorCartProvider({ children }: { children: React.ReactNode }) {
  const [items] = useState<CartItem[]>([])
  const [isOpen, setIsOpen] = useState(false)

  const addItem = useCallback((product: any, size: string, color: string, quantity = 1) => {
    // No editor, apenas simular sem realmente adicionar
    // Não fazer nada, apenas evitar erros
  }, [])

  const removeItem = useCallback((productId: string, size: string, color: string) => {
    // No editor, apenas simular
    // Não fazer nada, apenas evitar erros
  }, [])

  const updateQuantity = useCallback((productId: string, size: string, color: string, quantity: number) => {
    // No editor, apenas simular
    // Não fazer nada, apenas evitar erros
  }, [])

  const clearCart = useCallback(() => {
    // No editor, apenas simular
    // Não fazer nada, apenas evitar erros
  }, [])

  const itemCount = useMemo(() => 0, [])
  const total = useMemo(() => 0, [])

  const value = useMemo(() => ({
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    itemCount,
    total,
    isOpen,
    setIsOpen,
  }), [items, addItem, removeItem, updateQuantity, clearCart, itemCount, total, isOpen, setIsOpen])

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}

// Exportar também como CartProvider para compatibilidade
export const CartProvider = EditorCartProvider

export function useCart() {
  const context = useContext(CartContext)
  
  // Se não houver contexto (no editor), retornar valores padrão em vez de lançar erro
  if (context === undefined) {
    return {
      items: [],
      addItem: () => {},
      removeItem: () => {},
      updateQuantity: () => {},
      clearCart: () => {},
      itemCount: 0,
      total: 0,
      isOpen: false,
      setIsOpen: () => {},
    }
  }
  
  return context
}

