import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'

export interface SalesByDay {
  date: string // formato YYYY-MM-DD
  ordersCount: number
  revenue: string // em reais, como string
}

export interface SalesByPeriodResponse {
  sales: SalesByDay[]
}

export function useSalesByPeriod(startDate?: Date, endDate?: Date) {
  return useQuery({
    queryKey: ['sales-by-period', startDate?.toISOString(), endDate?.toISOString()],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (startDate) {
        params.append('start_date', startDate.toISOString().split('T')[0])
      }
      if (endDate) {
        params.append('end_date', endDate.toISOString().split('T')[0])
      }

      const response = await apiClient.get<SalesByPeriodResponse>(
        `/admin/dashboard/sales?${params.toString()}`
      )
      return response.data.sales
    },
    enabled: !!startDate && !!endDate, // Só busca quando ambas as datas estão definidas
    staleTime: 2 * 60 * 1000, // Cache por 2 minutos
    refetchOnWindowFocus: false
  })
}

