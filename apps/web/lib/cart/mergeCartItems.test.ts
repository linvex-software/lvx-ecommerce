import { describe, it, expect } from 'vitest'
import { mergeCartItems, type LocalCartItem, type RemoteCartItem } from './mergeCartItems'

describe('mergeCartItems', () => {
    it('deve usar quantidade do remoto quando item existe em ambos (não soma)', () => {
        const localItems: LocalCartItem[] = [
            { id: 'prod-1', quantity: 1, price: 10000, variant_id: null }
        ]
        const remoteItems: RemoteCartItem[] = [
            { product_id: 'prod-1', quantity: 1, price: 10000, variant_id: null }
        ]

        const result = mergeCartItems(localItems, remoteItems)

        expect(result).toHaveLength(1)
        expect(result[0].quantity).toBe(1) // Não soma: 1 + 1 = 1 (remoto vence)
        expect(result[0].product_id).toBe('prod-1')
    })

    it('deve adicionar item do local quando não existe no remoto', () => {
        const localItems: LocalCartItem[] = [
            { id: 'prod-1', quantity: 2, price: 10000, variant_id: null }
        ]
        const remoteItems: RemoteCartItem[] = []

        const result = mergeCartItems(localItems, remoteItems)

        expect(result).toHaveLength(1)
        expect(result[0].quantity).toBe(2)
        expect(result[0].product_id).toBe('prod-1')
    })

    it('deve adicionar itens diferentes de local e remoto', () => {
        const localItems: LocalCartItem[] = [
            { id: 'prod-1', quantity: 1, price: 10000, variant_id: null }
        ]
        const remoteItems: RemoteCartItem[] = [
            { product_id: 'prod-2', quantity: 1, price: 20000, variant_id: null }
        ]

        const result = mergeCartItems(localItems, remoteItems)

        expect(result).toHaveLength(2)
        expect(result.find(r => r.product_id === 'prod-1')?.quantity).toBe(1)
        expect(result.find(r => r.product_id === 'prod-2')?.quantity).toBe(1)
    })

    it('deve tratar variantes como itens diferentes', () => {
        const localItems: LocalCartItem[] = [
            { id: 'prod-1', quantity: 1, price: 10000, variant_id: 'size-P' }
        ]
        const remoteItems: RemoteCartItem[] = [
            { product_id: 'prod-1', quantity: 1, price: 10000, variant_id: 'size-G' }
        ]

        const result = mergeCartItems(localItems, remoteItems)

        expect(result).toHaveLength(2) // Variantes diferentes = itens diferentes
        expect(result.find(r => r.variant_id === 'size-P')?.quantity).toBe(1)
        expect(result.find(r => r.variant_id === 'size-G')?.quantity).toBe(1)
    })

    it('deve ser idempotente (mesmo resultado ao executar múltiplas vezes)', () => {
        const localItems: LocalCartItem[] = [
            { id: 'prod-1', quantity: 1, price: 10000, variant_id: null }
        ]
        const remoteItems: RemoteCartItem[] = [
            { product_id: 'prod-1', quantity: 1, price: 10000, variant_id: null }
        ]

        const result1 = mergeCartItems(localItems, remoteItems)

        // Simula segundo merge: converte resultado para formato local e merge novamente
        const result1AsLocal: LocalCartItem[] = result1.map(item => ({
            id: item.product_id,
            quantity: item.quantity,
            price: item.price,
            variant_id: item.variant_id
        }))
        const result2 = mergeCartItems(result1AsLocal, remoteItems)

        expect(result2).toHaveLength(1)
        expect(result2[0].quantity).toBe(1) // Continua 1, não dobra (remoto vence)
    })

    it('deve usar quantidade do remoto mesmo se local tiver quantidade diferente', () => {
        const localItems: LocalCartItem[] = [
            { id: 'prod-1', quantity: 5, price: 10000, variant_id: null }
        ]
        const remoteItems: RemoteCartItem[] = [
            { product_id: 'prod-1', quantity: 2, price: 10000, variant_id: null }
        ]

        const result = mergeCartItems(localItems, remoteItems)

        expect(result).toHaveLength(1)
        expect(result[0].quantity).toBe(2) // Usa quantidade do remoto, não do local
    })

    it('não deve dobrar quantidade quando local e remoto têm mesmo item com mesma quantidade', () => {
        // Simula cenário de reload: local tem qty 1, remoto tem qty 1
        const localItems: LocalCartItem[] = [
            { id: 'prod-1', quantity: 1, price: 10000, variant_id: null }
        ]
        const remoteItems: RemoteCartItem[] = [
            { product_id: 'prod-1', quantity: 1, price: 10000, variant_id: null }
        ]

        const result1 = mergeCartItems(localItems, remoteItems)
        expect(result1[0].quantity).toBe(1) // Não soma: 1 + 1 = 1

        // Simula segundo reload: ambos têm qty 1 ainda
        const result1AsLocal: LocalCartItem[] = result1.map(item => ({
            id: item.product_id,
            quantity: item.quantity,
            price: item.price,
            variant_id: item.variant_id
        }))
        const result2 = mergeCartItems(result1AsLocal, remoteItems)
        expect(result2[0].quantity).toBe(1) // Continua 1, não dobra
    })
})

