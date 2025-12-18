'use client'

import { useCartSync } from '@/lib/hooks/useCartSync'

interface CartSyncProviderProps {
  children: React.ReactNode
}

export function CartSyncProvider({ children }: CartSyncProviderProps) {
  // Inicializa a sincronização do carrinho
  useCartSync()

  return <>{children}</>
}




