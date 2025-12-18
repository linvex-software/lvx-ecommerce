import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { Coupon } from './use-coupons'

interface CreateCouponInput {
  code: string
  type: 'percent' | 'fixed'
  value: number // porcentagem ou centavos
  min_value?: number | null // centavos
  max_uses?: number | null
  expires_at?: string | null // String ISO
}

export function useCreateCoupon() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateCouponInput) => {
      const response = await apiClient.post<{ coupon: Coupon }>('/admin/coupons', input)
      return response.data.coupon
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] })
    },
  })
}

