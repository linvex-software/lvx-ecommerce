import { z } from 'zod'
import { FavoriteRepository } from '../../../infra/db/repositories/favorite-repository'

const checkFavoriteSchema = z.object({
  product_id: z.string().uuid('product_id deve ser um UUID válido')
})

export interface CheckFavoriteDependencies {
  favoriteRepository: FavoriteRepository
}

export interface CheckFavoriteResult {
  isFavorite: boolean
}

export async function checkFavoriteUseCase(
  storeId: string,
  customerId: string,
  input: z.infer<typeof checkFavoriteSchema>,
  dependencies: CheckFavoriteDependencies
): Promise<CheckFavoriteResult> {
  const { favoriteRepository } = dependencies

  // Validar input
  const validated = checkFavoriteSchema.parse(input)

  // Verificar se está favoritado
  const isFavorite = await favoriteRepository.checkIfFavorite(
    storeId,
    customerId,
    validated.product_id
  )

  return {
    isFavorite
  }
}

export { checkFavoriteSchema }

