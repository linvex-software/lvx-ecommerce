import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { ThemeConfig } from '@/components/theme/theme-form'

const THEME_QUERY_KEY = ['theme']

export function useTheme() {
  return useQuery({
    queryKey: THEME_QUERY_KEY,
    queryFn: async () => {
      const response = await apiClient.get<{ theme: ThemeConfig }>('/admin/store/theme')
      return response.data.theme
    }
  })
}

export function useUpdateTheme() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (config: ThemeConfig) => {
      const response = await apiClient.put<{ theme: ThemeConfig }>(
        '/admin/store/theme',
        config
      )
      return response.data.theme
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: THEME_QUERY_KEY })
    }
  })
}

