/**
 * Tipos de Domínio para Funcionalidade de Favoritos do Cliente
 * 
 * Define os tipos e interfaces usados na camada de domínio de favoritos.
 */

/**
 * Entidade básica de favorito do cliente
 */
export interface CustomerFavorite {
  id: string
  store_id: string
  customer_id: string
  product_id: string
  created_at: Date
}

/**
 * Informações do produto incluídas com o favorito
 */
export interface FavoriteProduct {
  id: string
  name: string
  slug: string
  base_price: string
  main_image: string | null
  status: string
}

/**
 * Favorito do cliente com detalhes completos do produto
 */
export interface CustomerFavoriteWithProduct extends CustomerFavorite {
  product: FavoriteProduct
}

/**
 * Input para adicionar um produto aos favoritos
 */
export interface AddFavoriteInput {
  product_id: string
}

/**
 * Input para remover um produto dos favoritos
 */
export interface RemoveFavoriteInput {
  product_id: string
}

/**
 * Input para verificar se produto está favoritado
 */
export interface CheckFavoriteInput {
  product_id: string
}

/**
 * Resultado da listagem de favoritos do cliente
 */
export interface ListFavoritesResult {
  favorites: CustomerFavoriteWithProduct[]
  count: number
}

