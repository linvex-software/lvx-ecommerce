import { z } from 'zod'
import { FavoriteRepository } from '../../../infra/db/repositories/favorite-repository'
import { ProductRepository } from '../../../infra/db/repositories/product-repository'
import type { CustomerFavorite } from '../../../domain/favorites/favorite-types'

const addFavoriteSchema = z.object({
  product_id: z.string().uuid('product_id deve ser um UUID válido')
})

export interface AddFavoriteDependencies {
  favoriteRepository: FavoriteRepository
  productRepository: ProductRepository
}

export interface AddFavoriteResult {
  favorite: CustomerFavorite
}

export async function addFavoriteUseCase(
  storeId: string,
  customerId: string,
  input: z.infer<typeof addFavoriteSchema>,
  dependencies: AddFavoriteDependencies
): Promise<AddFavoriteResult> {
  const { favoriteRepository, productRepository } = dependencies

  // Validar input
  const validated = addFavoriteSchema.parse(input)

  // Verificar se o produto existe e está ativo
  const product = await productRepository.findById(validated.product_id, storeId)
  if (!product) {
    throw new Error('Produto não encontrado')
  }

  if (product.status !== 'active') {
    throw new Error('Produto não está disponível')
  }

  // Verificar se já está favoritado
  const isFavorite = await favoriteRepository.checkIfFavorite(
    storeId,
    customerId,
    validated.product_id
  )

  if (isFavorite) {
    throw new Error('Produto já está nos favoritos')
  }

  // Criar favorito
  const favorite = await favoriteRepository.create(
    storeId,
    customerId,
    validated.product_id
  )

  return {
    favorite
  }
}

export { addFavoriteSchema }

