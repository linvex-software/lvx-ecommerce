import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { Coupon } from './use-coupons'

interface UpdateCouponInput {
  code?: string
  type?: 'percent' | 'fixed'
  value?: number
  min_value?: number | null
  max_uses?: number | null
  expires_at?: string | null  // String ISO ao invés de Date
  active?: boolean
}

export function useUpdateCoupon(couponId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: UpdateCouponInput) => {
      const response = await apiClient.put<{ coupon: Coupon }>(`/admin/coupons/${couponId}`, input)
      return response.data.coupon
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] })
    },
  })
}

