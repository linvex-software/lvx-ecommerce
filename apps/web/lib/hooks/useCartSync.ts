import { useEffect, useRef, useCallback } from 'react'
import { useCartStore } from '@/lib/store/useCartStore'
import { fetchAPI } from '@/lib/api'
import { getOrCreateSessionId } from '@/lib/utils/session'
import { mergeCartItems } from '@/lib/cart/mergeCartItems'

/**
 * Hook para sincronizar carrinho com o backend
 *
 * Estratégia de merge (CORRIGIDA - remoto é fonte de verdade):
 *
 * 1. Se carrinho remoto existe e local está vazio:
 *    → Hidrata estado local com dados remotos
 *
 * 2. Se carrinho local existe e remoto está vazio:
 *    → Sobe carrinho local pro backend
 *
 * 3. Se ambos existem com itens:
 *    → Merge: REMOTO vence quando item existe em ambos (não soma quantidades)
 *    → Itens que só existem no local são adicionados
 *    → Garante merge idempotente (não dobra quantidades a cada reload)
 *
 * 4. Se sync falhar:
 *    → Não bloqueia UI, apenas loga erro
 *    → Carrinho local continua funcionando
 *    → Próxima tentativa de sync tenta novamente
 *
 * Debounce: 800ms - balanceia responsividade vs número de requisições
 */

export function useCartSync() {
    const {
        items,
        cartId,
        sessionId,
        hydrateFromRemote,
        markSynced,
        setSessionId
    } = useCartStore()

    const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const isInitialLoadRef = useRef(true)
    const hasSyncErrorRef = useRef(false)

    // Função para sincronizar carrinho com backend
    const syncCartToBackend = useCallback(async () => {
        const sid = sessionId || getOrCreateSessionId()

        // Converte itens do frontend para formato do backend
        const cartItems = items
            .map((item) => {
                // Garantir que price seja número válido
                let price: number
                if (typeof item.price === 'string') {
                    price = parseFloat(item.price)
                } else if (typeof item.price === 'number') {
                    price = item.price
                } else {
                    price = 0
                }
                
                // Validar preço antes de incluir
                if (!Number.isFinite(price) || price <= 0) {
                    console.warn('[CartSync] Item com preço inválido ignorado:', item)
                    return null
                }
                
                return {
            product_id: String(item.id),
            variant_id: item.variant_id ?? null,
            quantity: item.quantity,
                    price: price
                }
            })
            .filter((item): item is NonNullable<typeof item> => item !== null)

        try {
            const response = await fetchAPI('/carts', {
                method: 'POST',
                body: JSON.stringify({
                    items: cartItems,
                    session_id: sid,
                    cart_id: cartId || undefined
                })
            }) as { cart: any }

            if (response.cart) {
                markSynced(response.cart.id, new Date().toISOString())
                hasSyncErrorRef.current = false
                useCartStore.getState().setSyncError(false)
            }
        } catch (error) {
            console.warn('[CartSync] Erro ao sincronizar carrinho (carrinho local continua funcionando):', error)
            hasSyncErrorRef.current = true
            useCartStore.getState().setSyncError(true)
            // Não quebra a UI, apenas loga o erro
            // Carrinho local continua funcionando normalmente
        }
    }, [items, cartId, sessionId, markSynced])

    // Inicializar sessionId
    useEffect(() => {
        if (!sessionId) {
            const sid = getOrCreateSessionId()
            setSessionId(sid)
        }
    }, [sessionId, setSessionId])

    // Carregar carrinho do backend no mount
    useEffect(() => {
        if (!isInitialLoadRef.current) return
        isInitialLoadRef.current = false

        const loadCart = async () => {
            try {
                const sid = sessionId || getOrCreateSessionId()
                const response = await fetchAPI(`/carts/me?session_id=${sid}`) as { cart?: any }

                if (response.cart) {
                    const currentItems = useCartStore.getState().items

                    if (currentItems.length === 0) {
                        // Caso 1: Remoto existe, local vazio → usa remoto
                        hydrateFromRemote(response.cart)
                    } else {
                        // Caso 3: Ambos existem → merge (remoto vence, não soma)
                        const mergedItems = mergeCartItems(currentItems, response.cart.items)

                        // Verifica se o merge resultou em mudanças comparando com o estado atual
                        // Se remoto e local são idênticos, o merge não muda nada
                        const currentItemsMap = new Map(
                            currentItems.map(item => [
                                `${item.id}_${item.variant_id || 'null'}`,
                                item
                            ])
                        )
                        const mergedItemsMap = new Map(
                            mergedItems.map(item => [
                                `${item.product_id}_${item.variant_id || 'null'}`,
                                item
                            ])
                        )

                        let hasChanges = false
                        // Verifica se quantidade ou número de itens mudou
                        if (mergedItems.length !== currentItems.length) {
                            hasChanges = true
                        } else {
                            for (const [key, merged] of mergedItemsMap.entries()) {
                                const local = currentItemsMap.get(key)
                                if (!local || local.quantity !== merged.quantity) {
                                    hasChanges = true
                                    break
                                }
                            }
                        }

                        // Busca dados completos dos produtos locais para manter nome/imagem
                        const mergedWithLocalData = mergedItems.map(mergedItem => {
                            // Tenta encontrar item local correspondente para pegar dados completos
                            const localItem = currentItems.find(
                                li => String(li.id) === mergedItem.product_id &&
                                (li.variant_id || null) === (mergedItem.variant_id || null)
                            )

                            return {
                                id: mergedItem.product_id,
                                name: localItem?.name || '',
                                price: mergedItem.price,
                                image: localItem?.image || '',
                                category: localItem?.category || '',
                                quantity: mergedItem.quantity,
                                variant_id: mergedItem.variant_id ?? null
                            }
                        })

                        // Atualiza estado local com resultado do merge
                        useCartStore.setState({ items: mergedWithLocalData })

                        // Só sincroniza se houve mudanças reais (evita loop desnecessário)
                        // Mudanças = itens novos do local que não existem no remoto
                        if (hasChanges) {
                            setTimeout(() => {
                                syncCartToBackend()
                            }, 100)
                        }
                    }
                } else {
                    const currentItems = useCartStore.getState().items
                    if (currentItems.length > 0) {
                        // Caso 2: Local existe, remoto vazio → sobe local
                        setTimeout(() => {
                            syncCartToBackend()
                        }, 100)
                    }
                }

                hasSyncErrorRef.current = false
                useCartStore.getState().setSyncError(false)
            } catch (error) {
                // Se não encontrou carrinho (404), é normal - pode não existir ainda
                if ((error as any)?.status !== 404) {
                    console.warn('[CartSync] Erro ao carregar carrinho:', error)
                    hasSyncErrorRef.current = true
                    useCartStore.getState().setSyncError(true)
                }
            }
        }

        loadCart()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [syncCartToBackend, hydrateFromRemote, sessionId]) // Apenas no mount

    // Sincronizar com debounce quando items mudarem
    useEffect(() => {
        // Não sincroniza no carregamento inicial
        if (isInitialLoadRef.current) return

        // Limpa timeout anterior
        if (syncTimeoutRef.current) {
            clearTimeout(syncTimeoutRef.current)
        }

        // Debounce de 800ms
        syncTimeoutRef.current = setTimeout(() => {
            syncCartToBackend()
        }, 800)

        return () => {
            if (syncTimeoutRef.current) {
                clearTimeout(syncTimeoutRef.current)
            }
        }
    }, [items, syncCartToBackend])

    return {
        syncCart: syncCartToBackend
    }
}

