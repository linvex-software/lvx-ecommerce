import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'

export interface OperationalMetrics {
  pendingOrders: number
  awaitingShipment: number
  lowStock: number
}

export function useOperationalMetrics() {
  return useQuery({
    queryKey: ['operational-metrics'],
    queryFn: async () => {
      const response = await apiClient.get<OperationalMetrics>(
        '/admin/dashboard/metrics'
      )
      return response.data
    },
    staleTime: 1 * 60 * 1000, // Cache por 1 minuto
    refetchOnWindowFocus: true // Atualizar ao focar na janela (métricas operacionais mudam frequentemente)
  })
}

