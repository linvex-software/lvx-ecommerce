'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth-store'
import { Button } from '@white-label/ui'
import { ArrowLeft } from 'lucide-react'

export default function UnauthorizedPage() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)

  useEffect(() => {
    // Se não estiver autenticado, redirecionar para login
    const isAuthenticated = useAuthStore.getState().isAuthenticated()
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50/50 px-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-100">
            <span className="text-2xl">🔒</span>
          </div>
          <h1 className="text-3xl font-light tracking-tight text-gray-900">Acesso negado</h1>
          <p className="mt-2 text-sm font-light text-gray-500">
            Você não tem permissão para acessar o painel administrativo
          </p>
        </div>

        {user && (
          <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-gray-400">
              Sua conta
            </p>
            <p className="mt-2 text-sm font-medium text-gray-900">{user.name}</p>
            <p className="text-xs text-gray-500">{user.email}</p>
            <p className="mt-2 text-xs text-gray-500">
              Role: <span className="font-medium">{user.role}</span>
            </p>
          </div>
        )}

        <div className="space-y-3">
          <Button onClick={() => router.push('/login')} className="w-full gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar ao login
          </Button>
          <p className="text-xs text-gray-500">
            Apenas usuários com role <span className="font-medium">admin</span> ou{' '}
            <span className="font-medium">operador</span> podem acessar esta área
          </p>
        </div>
      </div>
    </div>
  )
}

