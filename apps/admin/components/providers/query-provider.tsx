'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'

export function QueryProvider({ children }: { children: ReactNode }) {
  // Criar QueryClient no lado do cliente para evitar problemas de serialização
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
            staleTime: 5 * 60 * 1000 // 5 minutos
          },
          mutations: {
            retry: false
          }
        }
      })
  )

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

