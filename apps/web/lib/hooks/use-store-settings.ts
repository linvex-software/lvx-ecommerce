import { useQuery } from '@tanstack/react-query'
import { fetchAPI } from '../api'

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

export function useStoreSettings() {
    return useQuery<StoreSettings>({
        queryKey: ['store-settings-public'],
        queryFn: async () => {
            return fetchAPI('/stores/settings/public')
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    })
}
