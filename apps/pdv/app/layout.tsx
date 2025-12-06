'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { useAuthStore } from '@/store/auth-store'
import { QueryProvider } from '@/components/providers/query-provider'
import { apiClient } from '@/lib/api-client'
import './globals.css'

// Roles permitidas para acessar o PDV
const ALLOWED_ROLES: Array<'admin' | 'operador' | 'vendedor'> = ['admin', 'operador', 'vendedor']

// Rotas públicas que não precisam de autenticação
const PUBLIC_ROUTES = ['/login', '/onboarding', '/unauthorized']

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isMounted, setIsMounted] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated())
  const user = useAuthStore((state) => state.user)
  const clearSession = useAuthStore((state) => state.clearSession)

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname || '')

  useEffect(() => {
    setIsMounted(true)
    
    // Aguardar um pouco mais para garantir que o Zustand hidratou
    const timer = setTimeout(() => {
      setIsChecking(false)
    }, 100)
    
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!isMounted || isChecking) return

    // Se está em rota pública, não fazer verificações
    if (isPublicRoute) {
      return
    }

    // Se não tem usuário ou token no Zustand, redirecionar
    if (!user || !isAuthenticated) {
      router.push('/login')
      return
    }

    if (user.role && !ALLOWED_ROLES.includes(user.role)) {
      router.push('/unauthorized')
      return
    }
  }, [isMounted, isChecking, isAuthenticated, user, router, isPublicRoute])

  // Se está em rota pública, renderizar sem verificação
  if (isPublicRoute) {
    return (
      <html lang="pt-BR">
        <body>
          <QueryProvider>{children}</QueryProvider>
        </body>
      </html>
    )
  }

  // Mostrar loading enquanto verifica autenticação
  if (!isMounted || isChecking) {
    return (
      <html lang="pt-BR">
        <body>
          <div className="flex min-h-screen items-center justify-center bg-gray-50/50">
            <div className="text-sm font-light text-gray-500 tracking-wide">Carregando...</div>
          </div>
        </body>
      </html>
    )
  }

  // Verificar também localStorage diretamente (para quando Zustand ainda não hidratou após login)
  const hasLocalStorageAuth = typeof window !== 'undefined' && 
    localStorage.getItem('accessToken') && 
    localStorage.getItem('user')

  // Se não tem usuário ou não está autenticado, mas tem dados no localStorage, aguardar
  if ((!isAuthenticated || !user) && !hasLocalStorageAuth) {
    return (
      <html lang="pt-BR">
        <body>
          <div className="flex min-h-screen items-center justify-center bg-gray-50/50">
            <div className="text-sm font-light text-gray-500 tracking-wide">Carregando...</div>
          </div>
        </body>
      </html>
    )
  }

  // Se tem dados no localStorage mas Zustand ainda não hidratou, mostrar loading
  if (hasLocalStorageAuth && (!user || !isAuthenticated)) {
    return (
      <html lang="pt-BR">
        <body>
          <div className="flex min-h-screen items-center justify-center bg-gray-50/50">
            <div className="text-sm font-light text-gray-500 tracking-wide">Carregando...</div>
          </div>
        </body>
      </html>
    )
  }

  // Se não tem autenticação em lugar nenhum, mostrar loading (será redirecionado)
  if (!user || !isAuthenticated) {
    return (
      <html lang="pt-BR">
        <body>
          <div className="flex min-h-screen items-center justify-center bg-gray-50/50">
            <div className="text-sm font-light text-gray-500 tracking-wide">Carregando...</div>
          </div>
        </body>
      </html>
    )
  }

  // Se não tem role permitida, mostrar loading (será redirecionado)
  if (user.role && !ALLOWED_ROLES.includes(user.role)) {
    return (
      <html lang="pt-BR">
        <body>
          <div className="flex min-h-screen items-center justify-center bg-gray-50/50">
            <div className="text-sm font-light text-gray-500 tracking-wide">Carregando...</div>
          </div>
        </body>
      </html>
    )
  }

  const getUserInitials = () => {
    if (!user?.name) return 'U'
    const names = user.name.split(' ')
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase()
    }
    return user.name[0].toUpperCase()
  }

  return (
    <html lang="pt-BR">
      <body>
        <QueryProvider>
          <div className="flex min-h-screen w-full flex-col bg-gray-50">
            {/* Header igual ao admin */}
            <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-gray-200/60 bg-white/95 backdrop-blur-sm px-10">
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-900 text-sm font-semibold uppercase tracking-wide text-white shadow-lg">
                  {getUserInitials()}
                </div>
                
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                  <p className="text-xs font-light text-gray-500">{user?.email}</p>
                </div>
              </div>

              <button
                onClick={async () => {
                  try {
                    await apiClient.post('/auth/logout')
                  } catch (error) {
                    // Ignorar erros de logout
                  } finally {
                    clearSession()
                    router.push('/login')
                  }
                }}
                className="inline-flex items-center gap-2 rounded-2xl border border-gray-200/80 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-gray-300 hover:bg-white"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </button>
            </header>

            {/* Conteúdo principal - alinhado com header */}
            <main className="flex-1 overflow-y-auto">
              <div className="w-full px-10 py-8">{children}</div>
            </main>
          </div>
        </QueryProvider>
      </body>
    </html>
  )
}
