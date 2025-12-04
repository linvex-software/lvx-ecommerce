'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore, useIsAuthenticated, useHasHydrated } from '@/lib/store/useAuthStore'

interface RequireAuthProps {
  children: React.ReactNode
}

export function RequireAuth({ children }: RequireAuthProps) {
  const isAuthenticated = useIsAuthenticated()
  const hasHydrated = useHasHydrated()
  const router = useRouter()
  const pathname = usePathname()
  const [isMounted, setIsMounted] = useState(false)

  // Aguardar montagem no cliente
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Verificar autenticação após montagem e hidratação
  useEffect(() => {
    if (!isMounted) return
    
    // Se já hidratou, verificar autenticação imediatamente
    if (hasHydrated) {
      if (!isAuthenticated) {
        router.push(`/login?redirect=${encodeURIComponent(pathname || '/minha-conta')}`)
      }
      return
    }
    
    // Se ainda não hidratou, aguardar um pouco e verificar localStorage diretamente
    // Timeout de segurança: se não hidratou em 500ms, forçar verificação
    const timeout = setTimeout(() => {
      const currentHasHydrated = useAuthStore.getState()._hasHydrated
      if (!currentHasHydrated) {
        // Forçar hidratação manualmente lendo do localStorage
        if (typeof window !== 'undefined') {
          try {
            const authStorage = localStorage.getItem('auth-storage')
            if (authStorage) {
              const parsed = JSON.parse(authStorage)
              if (parsed?.state?.accessToken && parsed?.state?.customer) {
                // Atualizar o store manualmente se necessário
                useAuthStore.setState({
                  accessToken: parsed.state.accessToken,
                  customer: parsed.state.customer,
                  _hasHydrated: true,
                })
              } else {
                // Não tem dados, marcar como hidratado para permitir redirecionamento
                useAuthStore.setState({ _hasHydrated: true })
              }
            } else {
              // Não tem dados, marcar como hidratado
              useAuthStore.setState({ _hasHydrated: true })
            }
          } catch {
            // Em caso de erro, marcar como hidratado para não bloquear
            useAuthStore.setState({ _hasHydrated: true })
          }
        }
      }
    }, 500)
    
    return () => clearTimeout(timeout)
  }, [isMounted, hasHydrated, isAuthenticated, router, pathname])

  // Mostrar loading enquanto não montou ou não hidratou
  if (!isMounted || !hasHydrated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-lg">Carregando autenticação...</p>
        </div>
      </div>
    )
  }

  // Se não está autenticado, mostrar mensagem de redirecionamento
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-lg">Redirecionando para loja...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

