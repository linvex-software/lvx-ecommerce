import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'

export interface RevenueMetrics {
  totalRevenue: string // em reais, como string
  ordersCount: number
  averageOrderValue: string // em reais, como string
}

export function useRevenueMetrics(startDate?: Date, endDate?: Date) {
  return useQuery({
    queryKey: ['revenue-metrics', startDate?.toISOString(), endDate?.toISOString()],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (startDate) {
        params.append('start_date', startDate.toISOString().split('T')[0])
      }
      if (endDate) {
        params.append('end_date', endDate.toISOString().split('T')[0])
      }

      const response = await apiClient.get<RevenueMetrics>(
        `/admin/dashboard/revenue?${params.toString()}`
      )
      return response.data
    },
    enabled: !!startDate && !!endDate, // Só busca quando ambas as datas estão definidas
    staleTime: 2 * 60 * 1000, // Cache por 2 minutos
    refetchOnWindowFocus: false
  })
}

