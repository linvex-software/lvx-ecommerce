import { z } from 'zod'
import { PhysicalSalesCartRepository } from '../../../infra/db/repositories/physical-sales-cart-repository'
import { UserRepository } from '../../../infra/db/repositories/user-repository'
import type { PhysicalSalesCart } from '../../../domain/physical-sales/physical-sales-types'

const setCartSellerSchema = z.object({
  cart_id: z.string().uuid(),
  seller_user_id: z.string().uuid()
})

export interface SetCartSellerDependencies {
  physicalSalesCartRepository: PhysicalSalesCartRepository
  userRepository: UserRepository
}

export async function setCartSellerUseCase(
  input: z.infer<typeof setCartSellerSchema>,
  storeId: string,
  currentUserId: string,
  dependencies: SetCartSellerDependencies
): Promise<PhysicalSalesCart> {
  const { physicalSalesCartRepository, userRepository } = dependencies

  const validated = setCartSellerSchema.parse(input)

  // Validar que o novo vendedor existe e pertence à store
  const seller = await userRepository.findById(validated.seller_user_id, storeId)
  if (!seller) {
    throw new Error('Seller not found')
  }

  if (seller.role !== 'vendedor' && seller.role !== 'admin' && seller.role !== 'operador') {
    throw new Error('User is not a valid seller')
  }

  // Buscar carrinho
  const cart = await physicalSalesCartRepository.findById(validated.cart_id, storeId)
  if (!cart) {
    throw new Error('Cart not found')
  }

  // Apenas o dono do carrinho ou admin/operador pode alterar o vendedor
  if (cart.seller_user_id !== currentUserId) {
    const currentUser = await userRepository.findById(currentUserId, storeId)
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'operador')) {
      throw new Error('Only cart owner or admin/operador can change seller')
    }
  }

  if (cart.status !== 'active') {
    throw new Error('Cart is not active')
  }

  // Atualizar vendedor
  const updatedCart = await physicalSalesCartRepository.update(validated.cart_id, storeId, {
    seller_user_id: validated.seller_user_id
  })

  return updatedCart
}

export { setCartSellerSchema }

