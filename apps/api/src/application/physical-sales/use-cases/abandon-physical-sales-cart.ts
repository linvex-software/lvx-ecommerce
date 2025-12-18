import { PhysicalSalesCartRepository } from '../../../infra/db/repositories/physical-sales-cart-repository'

export interface AbandonPhysicalSalesCartDependencies {
  physicalSalesCartRepository: PhysicalSalesCartRepository
}

export async function abandonPhysicalSalesCartUseCase(
  cartId: string,
  storeId: string,
  sellerUserId: string,
  dependencies: AbandonPhysicalSalesCartDependencies
): Promise<void> {
  const { physicalSalesCartRepository } = dependencies

  // Verificar se carrinho existe e pertence ao vendedor
  const cart = await physicalSalesCartRepository.findById(cartId, storeId)
  if (!cart) {
    throw new Error('Cart not found')
  }

  if (cart.seller_user_id !== sellerUserId) {
    throw new Error('Cart does not belong to seller')
  }

  if (cart.status !== 'active') {
    throw new Error('Cart is not active')
  }

  // Marcar como abandonado
  await physicalSalesCartRepository.updateStatus(cartId, storeId, 'abandoned')
}

