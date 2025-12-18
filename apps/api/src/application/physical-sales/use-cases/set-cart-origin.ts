import { z } from 'zod'
import { PhysicalSalesCartRepository } from '../../../infra/db/repositories/physical-sales-cart-repository'
import type { PhysicalSalesCart } from '../../../domain/physical-sales/physical-sales-types'

const setCartOriginSchema = z.object({
  cart_id: z.string().uuid(),
  origin: z.string().min(1)
})

export interface SetCartOriginDependencies {
  physicalSalesCartRepository: PhysicalSalesCartRepository
}

export async function setCartOriginUseCase(
  input: z.infer<typeof setCartOriginSchema>,
  storeId: string,
  sellerUserId: string,
  dependencies: SetCartOriginDependencies
): Promise<PhysicalSalesCart> {
  const { physicalSalesCartRepository } = dependencies

  const validated = setCartOriginSchema.parse(input)

  // Buscar carrinho
  const cart = await physicalSalesCartRepository.findById(validated.cart_id, storeId)
  if (!cart) {
    throw new Error('Cart not found')
  }

  if (cart.seller_user_id !== sellerUserId) {
    throw new Error('Cart does not belong to seller')
  }

  if (cart.status !== 'active') {
    throw new Error('Cart is not active')
  }

  // Atualizar origem
  const updatedCart = await physicalSalesCartRepository.update(validated.cart_id, storeId, {
    origin: validated.origin
  })

  return updatedCart
}

export { setCartOriginSchema }

