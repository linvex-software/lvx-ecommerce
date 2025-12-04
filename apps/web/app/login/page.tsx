'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useLogin } from '@/lib/hooks/use-login'
import { useIsAuthenticated, useHasHydrated } from '@/lib/store/useAuthStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login, isLoading, error } = useLogin()
  const isAuthenticated = useIsAuthenticated()
  const hasHydrated = useHasHydrated()
  const [cpf, setCpf] = useState('')
  const [password, setPassword] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  // Redirecionar se já estiver autenticado
  useEffect(() => {
    if (hasHydrated && isAuthenticated) {
      router.push('/minha-conta')
    }
  }, [hasHydrated, isAuthenticated, router])

  // Limpar erro automaticamente após 3 segundos
  useEffect(() => {
    if (formError || error) {
      const timer = setTimeout(() => {
        setFormError(null)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [formError, error])

  const redirect = searchParams.get('redirect') || '/minha-conta'
  const registered = searchParams.get('registered') === 'true'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!cpf || !password) {
      setFormError('Por favor, preencha todos os campos')
      return
    }

    try {
      await login({ identifier: cpf, password })
    } catch (err) {
      setFormError(error || 'Erro ao fazer login')
    }
  }

  // Não renderizar nada enquanto verifica autenticação
  if (!hasHydrated || isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="text-center text-3xl font-bold text-gray-900">
            Acesse sua conta
          </h1>
          <p className="mt-2 text-center text-sm text-gray-600">
            Preencha seus dados de login para acessar sua central do cliente
          </p>
        </div>

        {registered && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded">
            Conta criada com sucesso! Faça login para continuar.
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="cpf">E-mail, CPF ou CNPJ</Label>
              <Input
                id="cpf"
                type="text"
                placeholder="E-mail, CPF ou CNPJ"
                value={cpf}
                onChange={(e) => setCpf(e.target.value)}
                className="mt-1"
                disabled={isLoading}
              />
            </div>

            <div>
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1"
                disabled={isLoading}
              />
            </div>

            {(error || formError) && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded text-sm">
                <p className="font-medium">Erro ao fazer login</p>
                <p className="mt-1">{formError || error}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Entrando...' : 'ENTRAR'}
            </Button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">OU</span>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <Link href="/primeiro-acesso">
                <Button
                  variant="outline"
                  className="w-full"
                >
                  PRIMEIRO ACESSO? <span className="">CADASTRE-SE</span>
                </Button>
              </Link>
              <Link href="/primeiro-acesso">
                <Button
                  variant="outline"
                  className="w-full"
                >
                  COMPROU E NÃO POSSUI SENHA? <span className="">CADASTRE-SE</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

