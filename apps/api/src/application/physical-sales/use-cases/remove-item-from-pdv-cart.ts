import { z } from 'zod'
import { PhysicalSalesCartRepository } from '../../../infra/db/repositories/physical-sales-cart-repository'
import type { PhysicalSalesCart } from '../../../domain/physical-sales/physical-sales-types'

const removeItemFromPdvCartSchema = z.object({
  cart_id: z.string().uuid(),
  product_id: z.string().uuid(),
  variant_id: z.string().uuid().optional().nullable()
})

export interface RemoveItemFromPdvCartDependencies {
  physicalSalesCartRepository: PhysicalSalesCartRepository
}

export async function removeItemFromPdvCartUseCase(
  input: z.infer<typeof removeItemFromPdvCartSchema>,
  storeId: string,
  sellerUserId: string,
  dependencies: RemoveItemFromPdvCartDependencies
): Promise<PhysicalSalesCart> {
  const { physicalSalesCartRepository } = dependencies

  const validated = removeItemFromPdvCartSchema.parse(input)

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

  // Remover item
  const updatedItems = cart.items.filter(
    (item) =>
      !(
        item.product_id === validated.product_id &&
        item.variant_id === validated.variant_id
      )
  )

  // Permitir carrinho vazio (pode ser preenchido depois)
  // Não lançar erro se ficar vazio

  // Atualizar carrinho
  const updatedCart = await physicalSalesCartRepository.update(validated.cart_id, storeId, {
    items: updatedItems
  })

  return updatedCart
}

export { removeItemFromPdvCartSchema }

