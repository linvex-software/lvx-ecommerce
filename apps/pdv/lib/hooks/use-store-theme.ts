import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../api-client'

export interface StoreTheme {
  logo_url: string | null
  banner_url: string | null
  primary_color: string | null
  secondary_color: string | null
  text_color: string | null
  icon_color: string | null
}

export function useStoreTheme() {
  return useQuery({
    queryKey: ['store-theme'],
    queryFn: async () => {
      const response = await apiClient.get<StoreTheme>('/stores/theme/public')
      return response.data
    }
  })
}

