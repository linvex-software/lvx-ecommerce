import { z } from 'zod'
import { FavoriteRepository } from '../../../infra/db/repositories/favorite-repository'

const removeFavoriteSchema = z.object({
  product_id: z.string().uuid('product_id deve ser um UUID válido')
})

export interface RemoveFavoriteDependencies {
  favoriteRepository: FavoriteRepository
}

export async function removeFavoriteUseCase(
  storeId: string,
  customerId: string,
  input: z.infer<typeof removeFavoriteSchema>,
  dependencies: RemoveFavoriteDependencies
): Promise<void> {
  const { favoriteRepository } = dependencies

  // Validar input
  const validated = removeFavoriteSchema.parse(input)

  // Verificar se está favoritado
  const isFavorite = await favoriteRepository.checkIfFavorite(
    storeId,
    customerId,
    validated.product_id
  )

  if (!isFavorite) {
    throw new Error('Produto não está nos favoritos')
  }

  // Remover favorito
  await favoriteRepository.delete(storeId, customerId, validated.product_id)
}

export { removeFavoriteSchema }

