'use client'

import { useRouter, usePathname } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { useAuthStore } from '@/store/auth-store'
import { apiClient } from '@/lib/api-client'

const routeDictionary: Array<{
  matcher: RegExp
  title: string
  subtitle: string
}> = [
  {
    matcher: /^\/dashboard/,
    title: 'Visão geral',
    subtitle: 'Resumo da operação da loja'
  },
  {
    matcher: /^\/products/,
    title: 'Produtos',
    subtitle: 'Gerencie catálogo, estoque e lançamentos'
  },
  {
    matcher: /^\/theme/,
    title: 'Tema & Branding',
    subtitle: 'Personalize o visual da sua loja white label'
  },
  {
    matcher: /^\/coupons/,
    title: 'Cupons e campanhas',
    subtitle: 'Aplique incentivos exclusivos por loja'
  },
  {
    matcher: /^\/settings/,
    title: 'Configurações',
    subtitle: 'Preferências avançadas da plataforma'
  }
]

export function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const user = useAuthStore((state) => state.user)
  const clearSession = useAuthStore((state) => state.clearSession)

  const handleLogout = async () => {
    try {
      await apiClient.post('/auth/logout')
    } catch (error) {
      // Ignorar erros no logout
    } finally {
      clearSession()
      router.push('/login')
    }
  }

  const getUserInitials = () => {
    if (!user?.name) return 'U'
    const names = user.name.split(' ')
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase()
    }
    return user.name[0].toUpperCase()
  }

  const routeMeta =
    routeDictionary.find((route) => route.matcher.test(pathname ?? '')) ??
    routeDictionary[0]

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-gray-200/60 bg-white/95 backdrop-blur-sm px-10">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-gray-400">
          Painel Admin
        </p>
        <h1 className="text-3xl font-light tracking-tight text-gray-900">{routeMeta.title}</h1>
        <p className="text-sm font-light text-gray-500">{routeMeta.subtitle}</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium text-gray-900">{user?.name}</p>
          <p className="text-xs font-light text-gray-500">{user?.email}</p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-900 text-sm font-semibold uppercase tracking-wide text-white shadow-lg">
          {getUserInitials()}
        </div>

        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-2 rounded-2xl border border-gray-200/80 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-gray-300 hover:bg-white"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </div>
    </header>
  )
}

