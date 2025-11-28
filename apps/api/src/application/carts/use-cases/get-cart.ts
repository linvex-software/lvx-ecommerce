import { CartRepository } from '../../../infra/db/repositories/cart-repository'
import type { Cart } from '../../../domain/carts/cart-types'

export interface GetCartDependencies {
  cartRepository: CartRepository
}

export async function getCartUseCase(
  storeId: string,
  sessionId?: string | null,
  customerId?: string | null,
  cartId?: string | null,
  dependencies: GetCartDependencies
): Promise<Cart | null> {
  const { cartRepository } = dependencies

  // Se tem cart_id, busca direto
  if (cartId) {
    return await cartRepository.findById(cartId, storeId)
  }

  // Caso contrário, busca por session ou customer
  return await cartRepository.findBySessionOrCustomer(
    storeId,
    sessionId,
    customerId
  )
}

