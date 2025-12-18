import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { toast } from 'sonner'

export interface StoreSocialMedia {
    facebook?: string
    instagram?: string
    twitter?: string
    linkedin?: string
    youtube?: string
    tiktok?: string
    whatsapp_link?: string
}

export interface StoreSettings {
    id: string
    name: string
    cnpj_cpf: string | null
    whatsapp: string | null
    email: string | null
    address: string | null
    social_media: StoreSocialMedia | null
    favicon_url: string | null
}

const SETTINGS_QUERY_KEY = ['store-settings']

export function useStoreSettings() {
    return useQuery<StoreSettings>({
        queryKey: SETTINGS_QUERY_KEY,
        queryFn: async () => {
            const response = await apiClient.get<StoreSettings>('/stores/settings')
            return response.data
        }
    })
}

export function useUpdateStoreSettings() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (settings: Partial<StoreSettings>) => {
            const response = await apiClient.put<{ success: boolean }>('/stores/settings', settings)
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: SETTINGS_QUERY_KEY })
            queryClient.invalidateQueries({ queryKey: ['public-store-settings'] }) // Invalidate public query too if matched
            toast.success('Configurações salvas com sucesso!')
        },
        onError: () => {
            toast.error('Erro ao salvar configurações')
        }
    })
}
