'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@white-label/ui'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/store/auth-store'
import { apiClient } from '@/lib/api-client'
import type { AuthUser } from '@white-label/types'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const setSession = useAuthStore((state) => state.setSession)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const response = await apiClient.post<{
        user: {
          id: string
          name: string
          email: string
          role: string
          storeId?: string
          store?: { id: string; name: string }
        }
        accessToken: string
      }>('/auth/login', {
        email,
        password
      })

      const { user, accessToken } = response.data

      setSession(user as AuthUser, accessToken, user.storeId)

      // Aguardar um pouco para o Zustand sincronizar antes de redirecionar
      await new Promise(resolve => setTimeout(resolve, 100))
      
      router.push('/')
      router.refresh()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao fazer login. Verifique suas credenciais.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-semibold tracking-tight text-gray-900">PDV</h1>
            <p className="mt-2 text-sm text-gray-500">Ponto de Venda</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-700">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="seu@email.com"
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-700">
                Senha
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                disabled={isLoading}
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

