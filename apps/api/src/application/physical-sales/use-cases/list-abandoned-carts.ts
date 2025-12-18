import { PhysicalSalesCartRepository } from '../../../infra/db/repositories/physical-sales-cart-repository'
import type { PhysicalSalesCart } from '../../../domain/physical-sales/physical-sales-types'

export interface ListAbandonedCartsDependencies {
  physicalSalesCartRepository: PhysicalSalesCartRepository
}

export async function listAbandonedCartsUseCase(
  storeId: string,
  sellerUserId?: string,
  dependencies?: ListAbandonedCartsDependencies
): Promise<PhysicalSalesCart[]> {
  const { physicalSalesCartRepository } = dependencies!

  if (sellerUserId) {
    return await physicalSalesCartRepository.findBySeller(storeId, sellerUserId, 'abandoned')
  }

  // Se não especificar vendedor, buscar todos os abandonados da loja
  // (isso requer um método adicional no repository, mas por enquanto retornamos vazio)
  // TODO: Adicionar método findAllAbandoned no repository se necessário
  return []
}

