import { z } from 'zod'
import { PhysicalSalesCartRepository } from '../../../infra/db/repositories/physical-sales-cart-repository'
import type { PhysicalSalesCart } from '../../../domain/physical-sales/physical-sales-types'

const updateItemQuantityPdvCartSchema = z.object({
  cart_id: z.string().uuid(),
  product_id: z.string().uuid(),
  variant_id: z.string().uuid().optional().nullable(),
  quantity: z.number().int().positive()
})

export interface UpdateItemQuantityPdvCartDependencies {
  physicalSalesCartRepository: PhysicalSalesCartRepository
}

export async function updateItemQuantityPdvCartUseCase(
  input: z.infer<typeof updateItemQuantityPdvCartSchema>,
  storeId: string,
  sellerUserId: string,
  dependencies: UpdateItemQuantityPdvCartDependencies
): Promise<PhysicalSalesCart> {
  const { physicalSalesCartRepository } = dependencies

  const validated = updateItemQuantityPdvCartSchema.parse(input)

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

  // Encontrar item
  const itemIndex = cart.items.findIndex(
    (item) =>
      item.product_id === validated.product_id &&
      item.variant_id === validated.variant_id
  )

  if (itemIndex < 0) {
    throw new Error('Item not found in cart')
  }

  // Atualizar quantidade
  const updatedItems = [...cart.items]
  updatedItems[itemIndex] = {
    ...updatedItems[itemIndex],
    quantity: validated.quantity
  }

  // Atualizar carrinho
  const updatedCart = await physicalSalesCartRepository.update(validated.cart_id, storeId, {
    items: updatedItems
  })

  return updatedCart
}

export { updateItemQuantityPdvCartSchema }

