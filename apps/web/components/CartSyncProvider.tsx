'use client'

import { useCartSync } from '@/lib/hooks/useCartSync'
import type { ReactNode } from 'react'

/**
 * Provider que inicializa a sincronização do carrinho
 * Deve ser usado no layout raiz para garantir que o carrinho seja carregado/sincronizado
 */
export function CartSyncProvider({ children }: { children: ReactNode }) {
    useCartSync()
    return <>{children}</>
}

