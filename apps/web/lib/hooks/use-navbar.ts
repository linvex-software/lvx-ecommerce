import { useQuery } from '@tanstack/react-query'
import { fetchAPI } from '../api'
import type { NavbarItem } from '../types/navbar'

export function useNavbar() {
  return useQuery<{ navbar_items: NavbarItem[] }>({
    queryKey: ['navbar'],
    queryFn: () => fetchAPI('/store/navbar'),
    staleTime: 1000 * 60 * 5, // 5 minutos
    refetchOnWindowFocus: false,
    onError: (error) => {
      console.error('Failed to fetch navbar:', error)
    }
  })
}












