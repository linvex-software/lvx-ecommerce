import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../api-client'
import { toast } from 'sonner'

interface StoreTheme {
  logo_url: string | null
  banner_url: string | null
}

export function useStoreTheme() {
  return useQuery<StoreTheme>({
    queryKey: ['store-theme'],
    queryFn: async () => {
      const response = await apiClient.get<StoreTheme>('/stores/theme')
      return response.data
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
      queryClient.invalidateQueries({ queryKey: ['store-theme'] })
      toast.success('Logo atualizado com sucesso!')
    },
    onError: () => {
      toast.error('Erro ao atualizar logo')
    }
  })
}

export function useUpdateStoreBanner() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (bannerUrl: string | null) => {
      const response = await apiClient.put<{ success: boolean }>('/stores/banner', {
        banner_url: bannerUrl
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-theme'] })
      toast.success('Banner atualizado com sucesso!')
    },
    onError: () => {
      toast.error('Erro ao atualizar banner')
    }
  })
}

