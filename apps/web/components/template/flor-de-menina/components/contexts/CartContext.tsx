'use client'

import React, { createContext, useContext, useCallback } from "react";
import { Product } from "../../data/products";

// Importar useCartStore condicionalmente
// No web: usar o store real
// No admin: usar mock (o useCart já retorna valores padrão quando não há contexto)
let useCartStoreHook: any;

// Verificar se estamos no contexto do web (onde o store existe)
if (typeof window !== 'undefined') {
  try {
    // Tentar importar usando caminho relativo
    // apps/web/components/template/woman-shop-template/components/contexts/
    // Para apps/web/lib/store/useCartStore: ../../../../../lib/store/useCartStore
    const storeModule = require('../../../../../lib/store/useCartStore');
    useCartStoreHook = storeModule.useCartStore;
  } catch (error) {
    // Se falhar (ex: no admin), usar mock
    useCartStoreHook = () => ({
      items: [],
      addItem: () => {},
      removeItem: () => {},
      updateQuantity: () => {},
      clearCart: () => {},
      openCart: () => {},
      closeCart: () => {},
      isOpen: false,
    });
  }
} else {
  // SSR: usar mock
  useCartStoreHook = () => ({
    items: [],
    addItem: () => {},
    removeItem: () => {},
    updateQuantity: () => {},
    clearCart: () => {},
    openCart: () => {},
    closeCart: () => {},
    isOpen: false,
  });
}

export interface CartItem {
  product: Product;
  quantity: number;
  size: string;
  color: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, size: string, color: string, quantity?: number) => void;
  removeItem: (productId: string, size: string, color: string) => void;
  updateQuantity: (productId: string, size: string, color: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  total: number;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const store = useCartStoreHook();
  const { items: storeItems, addItem: storeAddItem, removeItem: storeRemoveItem, updateQuantity: storeUpdateQuantity, clearCart: storeClearCart, openCart, closeCart, isOpen } = store;

  // Converter items do store para formato do CartContext
  const items: CartItem[] = storeItems.map((item: any) => ({
    product: {
      id: String(item.id),
      slug: item.slug, // Preservar slug se disponível
      name: item.name,
      price: typeof item.price === 'string' ? parseFloat(item.price) : item.price,
      images: item.image ? [item.image] : [],
      category: item.category || '',
      sizes: ['P', 'M', 'G'],
      colors: [{ name: 'Default', hex: '#000000' }],
      description: ''
    },
    quantity: item.quantity,
    size: 'M',
    color: 'Default'
  }));

  const addItem = useCallback((product: Product, size: string, color: string, quantity = 1) => {
    storeAddItem({
      id: product.id,
      slug: product.slug, // Preservar slug
      name: product.name,
      price: product.price,
      image: product.images[0] || '',
      category: product.category,
      description: product.description
    });
    openCart();
  }, [storeAddItem, openCart]);

  const removeItem = useCallback((productId: string, size: string, color: string) => {
    storeRemoveItem(productId);
  }, [storeRemoveItem]);

  const updateQuantity = useCallback((productId: string, size: string, color: string, quantity: number) => {
    storeUpdateQuantity(productId, quantity);
  }, [storeUpdateQuantity]);

  const clearCart = useCallback(() => {
    storeClearCart();
  }, [storeClearCart]);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const total = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  return (
    <CartContext.Provider value={{
      items,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      itemCount,
      total,
      isOpen,
      setIsOpen: (open: boolean) => open ? openCart() : closeCart()
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  
  // Se não houver contexto (ex: no editor), retornar valores padrão em vez de lançar erro
  // Isso permite que os componentes funcionem no editor sem precisar do provider
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
    };
  }
  
  return context;
}
