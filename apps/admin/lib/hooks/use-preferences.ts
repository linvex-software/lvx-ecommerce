import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { toast } from 'sonner'

export interface StorePreferences {
  logo_url: string | null
  primary_color: string | null
  secondary_color: string | null
  text_color: string | null
  icon_color: string | null
}

const PREFERENCES_QUERY_KEY = ['store-preferences']

export function useStorePreferences() {
  return useQuery<StorePreferences>({
    queryKey: PREFERENCES_QUERY_KEY,
    queryFn: async () => {
      const response = await apiClient.get<StorePreferences>('/stores/preferences')
      return response.data
    }
  })
}

export function useUpdateStorePreferences() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (preferences: Partial<StorePreferences>) => {
      const response = await apiClient.put<{ success: boolean }>('/stores/preferences', preferences)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PREFERENCES_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: ['store-theme'] })
      // Forçar refetch imediato
      queryClient.refetchQueries({ queryKey: ['store-theme'] })
      toast.success('Preferências salvas com sucesso!')
    },
    onError: () => {
      toast.error('Erro ao salvar preferências')
    }
  })
}

export function useUpdateStoreLogo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (logoUrl: string | null) => {
      const response = await apiClient.put<{ success: boolean }>('/stores/logo', {
        logo_url: logoUrl
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PREFERENCES_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: ['store-theme'] })
      // Forçar refetch imediato
      queryClient.refetchQueries({ queryKey: ['store-theme'] })
      toast.success('Logo atualizado com sucesso!')
    },
    onError: () => {
      toast.error('Erro ao atualizar logo')
    }
  })
}

