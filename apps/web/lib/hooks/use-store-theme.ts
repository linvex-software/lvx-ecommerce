import { useQuery } from '@tanstack/react-query'
import { fetchAPI } from '../api'

interface StoreTheme {
  logo_url: string | null
  banner_url: string | null
  primary_color: string | null
  secondary_color: string | null
  text_color: string | null
  icon_color: string | null
}

export function useStoreTheme() {
  return useQuery<StoreTheme>({
    queryKey: ['store-theme'],
    queryFn: async () => {
      return fetchAPI('/stores/theme/public')
    },
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
    refetchOnWindowFocus: false
  })
}




