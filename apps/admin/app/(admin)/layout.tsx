'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/auth-store'
import { AdminShell } from '@/components/layout/admin-shell'

// Roles permitidas para acessar o painel admin
const ALLOWED_ROLES: Array<'admin' | 'operador' | 'vendedor'> = ['admin', 'operador']

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isMounted, setIsMounted] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated())
  const user = useAuthStore((state) => state.user)
  
  // Verificar se é a rota do editor (que tem seu próprio layout)
  const isEditorRoute = pathname?.startsWith('/editor')

  // Calcular se precisa onboarding diretamente
  const needsOnboarding = !user?.storeId && !user?.store

  // Aguardar montagem no cliente (hidratação do Zustand)
  useEffect(() => {
    setIsMounted(true)
    
    // Verificar localStorage diretamente enquanto Zustand hidrata
    const checkStorage = () => {
      if (typeof window === 'undefined') return false
      
      const token = localStorage.getItem('accessToken')
      const userStr = localStorage.getItem('user')
      
      return !!(token && userStr)
    }

    // Se já tem dados no localStorage, aguardar pouco tempo para Zustand hidratar
    if (checkStorage()) {
      const timer = setTimeout(() => {
        setIsChecking(false)
      }, 50)
      return () => clearTimeout(timer)
    } else {
      // Se não tem dados, pode verificar imediatamente
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

    // Verificar se precisa fazer onboarding
    if (needsOnboarding) {
      router.push('/onboarding')
      return
    }


    // Verificar se está autenticado (tem token e store selecionada)
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    // Verificar se o usuário tem role permitida
    if (user.role && !ALLOWED_ROLES.includes(user.role)) {
      router.push('/unauthorized')
      return
    }
  }, [isMounted, isChecking, isAuthenticated, user, needsOnboarding, router])

  // Para rotas do editor, passar direto - o editor tem seu próprio loading
  // Para outras rotas, mostrar loading apenas se realmente não estiver autenticado
  if (!isEditorRoute && (!isMounted || isChecking || !isAuthenticated || !user)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50/50">
        <div className="text-sm font-light text-gray-500 tracking-wide">Carregando...</div>
      </div>
    )
  }
  
  // Para editor, passar direto - não mostrar loading aqui
  // O editor tem seu próprio controle de autenticação
  if (isEditorRoute) {
    if (!isMounted || isChecking) {
      return <>{children}</>
    }
    // Verificar autenticação e role para editor em background, mas não bloquear renderização
    // O editor/layout.tsx fará essa verificação
    if (user && user.role && !ALLOWED_ROLES.includes(user.role)) {
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
    return <>{children}</>
  }

  // Verificar role antes de renderizar (apenas para rotas não-editor)
  if (!user || !user.role || !(ALLOWED_ROLES as readonly string[]).includes(user.role)) {
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

  // Se for a rota do editor, não aplicar AdminShell (ele tem seu próprio layout com sidebar)
  if (isEditorRoute) {
    return <>{children}</>
  }

  return <AdminShell>{children}</AdminShell>
}

