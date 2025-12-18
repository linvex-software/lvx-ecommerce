import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'

export function useDeleteCoupon() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (couponId: string) => {
      await apiClient.delete(`/admin/coupons/${couponId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] })
    },
  })
}

