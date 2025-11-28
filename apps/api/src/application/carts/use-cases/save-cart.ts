import { z } from 'zod'
import { CartRepository } from '../../../infra/db/repositories/cart-repository'
import type { Cart, CreateCartInput } from '../../../domain/carts/cart-types'

const cartItemSchema = z.object({
  product_id: z.string().uuid(),
  variant_id: z.string().uuid().nullable().optional(),
  quantity: z.number().int().positive(),
  price: z.number().positive()
})

export const saveCartSchema = z.object({
  items: z.array(cartItemSchema).min(0),
  coupon_code: z.string().optional().nullable(),
  customer_id: z.string().uuid().optional().nullable(),
  session_id: z.string().optional().nullable(),
  cart_id: z.string().uuid().optional() // Para atualizar carrinho existente
})

export interface SaveCartDependencies {
  cartRepository: CartRepository
}

export async function saveCartUseCase(
  input: z.infer<typeof saveCartSchema>,
  storeId: string,
  dependencies: SaveCartDependencies
): Promise<Cart> {
  const { cartRepository } = dependencies

  const validated = saveCartSchema.parse(input)

  // Regra de negócio: Carrinho vazio
  // - Se tem cart_id: atualiza para vazio (permite limpar carrinho)
  // - Se não tem cart_id: não cria carrinho novo vazio (rejeita)
  if (validated.items.length === 0) {
    if (validated.cart_id) {
      // Limpar carrinho existente
      const cartInput: CreateCartInput = {
        items: [],
        coupon_code: null,
        customer_id: validated.customer_id ?? null,
        session_id: validated.session_id ?? null
      }
      return await cartRepository.update(validated.cart_id, storeId, cartInput)
    }
    // Não permite criar carrinho vazio novo
    throw new Error('Cannot create empty cart. Provide at least one item or an existing cart_id to clear.')
  }

  // Validação: Garantir que session_id ou customer_id existe
  if (!validated.session_id && !validated.customer_id) {
    throw new Error('Either session_id or customer_id must be provided')
  }

  // Validação: session_id não pode ser string vazia
  if (validated.session_id !== null && validated.session_id !== undefined && validated.session_id.trim() === '') {
    throw new Error('session_id cannot be empty string')
  }

  // Recalcular total baseado nos itens (não confiar no cliente)
  const calculatedTotal = validated.items.reduce(
    (sum, item) => {
      // Validação: preço e quantidade devem ser válidos
      if (item.price <= 0 || item.quantity <= 0 || !Number.isFinite(item.price) || !Number.isFinite(item.quantity)) {
        throw new Error('Invalid item price or quantity')
      }
      return sum + item.price * item.quantity
    },
    0
  )

  // Validação: total não pode ser negativo ou NaN
  if (!Number.isFinite(calculatedTotal) || calculatedTotal < 0) {
    throw new Error('Invalid cart total')
  }

  const cartInput: CreateCartInput = {
    items: validated.items,
    coupon_code: validated.coupon_code ?? null,
    customer_id: validated.customer_id ?? null,
    session_id: validated.session_id ?? null
  }

  const cart = await cartRepository.upsert(
    cartInput,
    storeId,
    validated.cart_id
  )

  return cart
}

