import { useQuery } from '@tanstack/react-query'
import { fetchAPI } from '../api'

export interface DesignSettings {
  design_settings?: {
    hero_title?: string | null
    hero_subtitle?: string | null
    hero_image?: string | null
  }
}

export function useDesignSettings() {
  return useQuery<DesignSettings>({
    queryKey: ['design-settings'],
    queryFn: async () => {
      try {
        return await fetchAPI('/stores/settings/design')
      } catch (error) {
        // Se não existir o endpoint, retornar objeto vazio
        return { design_settings: null }
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

