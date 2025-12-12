import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'

export interface Coupon {
  id: string
  store_id: string
  code: string
  type: 'percent' | 'fixed'
  value: string // numeric como string do Drizzle
  min_value: string | null
  max_uses: number | null
  used_count: number
  expires_at: string | null
  active: boolean
  created_at: string
}

interface ListCouponsParams {
  active?: boolean
}

export function useCoupons(params?: ListCouponsParams) {
  return useQuery({
    queryKey: ['coupons', params],
    queryFn: async () => {
      const queryParams = new URLSearchParams()
      if (params?.active !== undefined) {
        queryParams.append('active', String(params.active))
      }

      const url = `/admin/coupons${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
      const response = await apiClient.get<{ coupons: Coupon[] }>(url)
      return response.data.coupons
    },
  })
}

