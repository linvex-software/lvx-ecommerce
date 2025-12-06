'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/auth-store'

// Roles permitidas para acessar o editor
const ALLOWED_ROLES: Array<'admin' | 'operador' | 'vendedor'> = ['admin', 'operador']

export default function EditorLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isMounted, setIsMounted] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated())
  const user = useAuthStore((state) => state.user)
  
  // Verificar se é a página de preferências (que precisa de scroll)
  const isPreferencesPage = pathname === '/editor/preferences'

  // Aguardar montagem no cliente
  useEffect(() => {
    setIsMounted(true)
    
    const checkStorage = () => {
      if (typeof window === 'undefined') return false
      const token = localStorage.getItem('accessToken')
      const userStr = localStorage.getItem('user')
      return !!(token && userStr)
    }

    if (checkStorage()) {
      const timer = setTimeout(() => {
        setIsChecking(false)
      }, 50)
      return () => clearTimeout(timer)
    } else {
      setIsChecking(false)
    }
  }, [])

  // Verificar autenticação após hidratação
  useEffect(() => {
    if (!isMounted || isChecking) return

    if (!user) {
      router.push('/login')
      return
    }

    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    if (user.role && !ALLOWED_ROLES.includes(user.role)) {
      router.push('/unauthorized')
      return
    }
  }, [isMounted, isChecking, isAuthenticated, user, router])

  // Mostrar loading enquanto verifica autenticação
  if (!isMounted || isChecking || !isAuthenticated || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50/50">
        <div className="text-sm font-light text-gray-500 tracking-wide">Carregando...</div>
      </div>
    )
  }

  // Verificar role antes de renderizar
  if (!ALLOWED_ROLES.includes(user.role)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50/50">
        <div className="text-center">
          <p className="text-sm font-medium text-gray-900">Acesso negado</p>
          <p className="mt-1 text-xs text-gray-500">
            Você não tem permissão para acessar esta área
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`h-screen w-full ${isPreferencesPage ? 'overflow-y-auto' : 'overflow-hidden'}`}>
      {children}
    </div>
  )
}

