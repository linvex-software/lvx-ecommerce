import { FavoriteRepository } from '../../../infra/db/repositories/favorite-repository'
import type { ListFavoritesResult } from '../../../domain/favorites/favorite-types'

export interface ListFavoritesDependencies {
  favoriteRepository: FavoriteRepository
}

export async function listFavoritesUseCase(
  storeId: string,
  customerId: string,
  dependencies: ListFavoritesDependencies
): Promise<ListFavoritesResult> {
  const { favoriteRepository } = dependencies

  const favorites = await favoriteRepository.findByCustomer(storeId, customerId)
  const count = await favoriteRepository.countByCustomer(storeId, customerId)

  return {
    favorites,
    count
  }
}

