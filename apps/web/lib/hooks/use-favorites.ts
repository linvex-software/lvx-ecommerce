import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchAPI } from '@/lib/api'
import { useAuthStore } from '@/lib/store/useAuthStore'

export interface FavoriteProduct {
  id: string
  name: string
  slug: string
  base_price: string
  main_image: string | null
  status: string
}

export interface Favorite {
  id: string
  store_id: string
  customer_id: string
  product_id: string
  created_at: string
  product: FavoriteProduct
}

interface FavoritesResponse {
  favorites: Favorite[]
  count: number
}

/**
 * Hook para listar todos os favoritos do cliente
 */
export function useFavorites() {
  const { accessToken, customer } = useAuthStore()
  const isAuthenticated = !!(accessToken && customer)

  return useQuery({
    queryKey: ['customer-favorites'],
    queryFn: async () => {
      if (!isAuthenticated) {
        throw new Error('Not authenticated')
      }
      const data = await fetchAPI('/customers/me/favorites')
      return data as FavoritesResponse
    },
    enabled: isAuthenticated,
    retry: false,
    staleTime: 30000, // 30 segundos
    refetchOnWindowFocus: false,
  })
}

/**
 * Hook para verificar se um produto está favoritado
 */
export function useCheckFavorite(productId: string | null | undefined) {
  const { accessToken, customer } = useAuthStore()
  const isAuthenticated = !!(accessToken && customer)

  return useQuery({
    queryKey: ['customer-favorite-check', productId],
    queryFn: async () => {
      if (!productId || !isAuthenticated) {
        return { isFavorite: false }
      }

      try {
        const data = await fetchAPI(`/customers/me/favorites/${productId}/check`)
        return data as { isFavorite: boolean }
      } catch (error: any) {
        // Se der erro 401, não está autenticado
        if (error?.status === 401) {
          return { isFavorite: false }
        }
        // Se der erro 404, produto não está favoritado (comportamento normal)
        if (error?.status === 404) {
          return { isFavorite: false }
        }
        // Outros erros, retornar false por padrão
        return { isFavorite: false }
      }
    },
    enabled: isAuthenticated && !!productId,
    retry: false,
    staleTime: 10000, // 10 segundos
    refetchOnWindowFocus: false,
  })
}

/**
 * Hook para adicionar um produto aos favoritos
 */
export function useAddFavorite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (productId: string) => {
      const data = await fetchAPI('/customers/me/favorites', {
        method: 'POST',
        body: JSON.stringify({ product_id: productId }),
      }) as { favorite: Favorite }
      return { favorite: data.favorite, productId } as { favorite: Favorite; productId: string }
    },
    onSuccess: (data) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['customer-favorites'] })
      queryClient.invalidateQueries({ queryKey: ['customer-favorite-check'] })
      // Atualizar cache imediatamente para melhor UX
      queryClient.setQueryData(['customer-favorite-check', data.productId], { isFavorite: true })
    }
  })
}

/**
 * Hook para remover um produto dos favoritos
 */
export function useRemoveFavorite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (productId: string) => {
      await fetchAPI(`/customers/me/favorites/${productId}`, {
        method: 'DELETE',
      })
      return productId
    },
    onSuccess: (productId) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['customer-favorites'] })
      queryClient.invalidateQueries({ queryKey: ['customer-favorite-check'] })
      // Atualizar cache imediatamente para melhor UX
      queryClient.setQueryData(['customer-favorite-check', productId], { isFavorite: false })
    }
  })
}

