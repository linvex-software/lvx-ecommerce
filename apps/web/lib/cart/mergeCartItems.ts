/**
 * Função pura para merge de carrinhos local e remoto
 *
 * Estratégia: REMOTO é a fonte de verdade quando existe
 * - Se item existe no remoto: usa quantidade do remoto (não soma)
 * - Se item não existe no remoto mas existe no local: adiciona do local
 *
 * Isso garante que o merge seja idempotente e não cause duplicação de quantidades
 */

export interface LocalCartItem {
    id: string | number
    quantity: number
    variant_id?: string | null
    price: number
    [key: string]: any
}

export interface RemoteCartItem {
    product_id: string
    variant_id?: string | null
    quantity: number
    price: number
}

export interface MergedCartItem {
    product_id: string
    variant_id?: string | null
    quantity: number
    price: number
}

/**
 * Gera chave única para um item baseado em product_id e variant_id
 */
function getItemKey(productId: string | number, variantId?: string | null): string {
    return `${productId}_${variantId || 'null'}`
}

/**
 * Merge de carrinhos: remoto vence quando existe, local adiciona itens novos
 *
 * @param localItems - Itens do carrinho local (localStorage)
 * @param remoteItems - Itens do carrinho remoto (backend)
 * @returns Array de itens mesclados
 */
export function mergeCartItems(
    localItems: LocalCartItem[],
    remoteItems: RemoteCartItem[]
): MergedCartItem[] {
    // Mapa para resultado final
    const mergedMap = new Map<string, MergedCartItem>()

    // 1. Adiciona TODOS os itens remotos primeiro (remoto é fonte de verdade)
    for (const remoteItem of remoteItems) {
        const key = getItemKey(remoteItem.product_id, remoteItem.variant_id)
        mergedMap.set(key, {
            product_id: remoteItem.product_id,
            variant_id: remoteItem.variant_id ?? null,
            quantity: remoteItem.quantity, // Usa quantidade do remoto
            price: remoteItem.price
        })
    }

    // 2. Adiciona itens locais que NÃO existem no remoto
    for (const localItem of localItems) {
        // Usa product_id do local como chave (mesmo formato que remoto)
        const key = getItemKey(String(localItem.id), localItem.variant_id)

        if (!mergedMap.has(key)) {
            // Item não existe no remoto → adiciona do local
            // Isso permite que itens novos adicionados localmente sejam preservados
            mergedMap.set(key, {
                product_id: String(localItem.id),
                variant_id: localItem.variant_id ?? null,
                quantity: localItem.quantity,
                price: localItem.price
            })
        }
        // Se já existe no remoto, IGNORA o local (remoto vence - não soma quantidades)
    }

    return Array.from(mergedMap.values())
}

