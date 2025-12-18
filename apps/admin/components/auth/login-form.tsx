'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { loginSchema, type LoginInput } from '@white-label/types'
import { useAuthStore } from '@/store/auth-store'
import { Button } from '@white-label/ui'
import { cn } from '@white-label/ui'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface LoginResponse {
  accessToken?: string | null
  user: {
    id: string
    name: string
    email: string
    role?: 'admin' | 'operador' | 'vendedor'
    storeId?: string
    store?: {
      id: string
      name: string
      domain: string
      active: boolean
    }
  }
}

export function LoginForm() {
  const router = useRouter()
  const setSession = useAuthStore((state) => state.setSession)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema)
  })

  const loginMutation = useMutation({
    mutationFn: async (data: LoginInput) => {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'

      // Login não precisa mais de storeId no header
      const response = await axios.post<LoginResponse>(
        `${API_URL}/auth/login`,
        data,
        {
          headers: {
            'Content-Type': 'application/json'
          },
          withCredentials: true
        }
      )

      return response.data
    },
    onSuccess: (data) => {
      // Sempre salvar token (mesmo que seja temporário para seleção)
      setSession(data.user, data.accessToken || null, data.user.storeId)

      // Verificar fluxo após login
      if (!data.user.storeId || !data.user.store) {
        // Usuário não tem loja - ir para onboarding
        router.push('/onboarding')
      } else {
        // Usuário tem loja - ir para dashboard
      router.push('/dashboard')
      }
    },
    onError: (error: unknown) => {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { error?: string } } }
        setError(axiosError.response?.data?.error || 'Erro ao fazer login')
      } else {
        setError('Erro ao fazer login. Tente novamente.')
      }
    }
  })

  const onSubmit = (data: LoginInput) => {
    setError(null)
    loginMutation.mutate(data)
  }

  return (
    <Card className="w-full rounded-2xl border border-gray-200/80 shadow-[0_20px_60px_rgba(0,0,0,0.12)] bg-white/95 backdrop-blur-md">
      <CardHeader className="space-y-3 pb-10 pt-12 px-6 sm:px-12">
        <CardTitle className="text-3xl sm:text-3xl font-normal tracking-tight text-gray-900 text-center">
          Acessar painel
        </CardTitle>
        <CardDescription className="text-center text-sm font-light text-gray-500 mt-2">
          Entre com suas credenciais para continuar
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6 sm:px-12 pb-12">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="rounded-lg bg-red-50/90 border border-red-200/60 px-4 py-3 text-sm text-red-700 font-light animate-in fade-in">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <Label htmlFor="email" className="text-sm font-medium text-gray-700">
              E-mail
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              autoComplete="email"
              {...register('email')}
              className={cn(
                'h-14 text-base border-gray-200/80 transition-all duration-200',
                'hover:border-gray-400 hover:shadow-sm',
                'focus-visible:border-gray-900 focus-visible:ring-4 focus-visible:ring-gray-900/10 focus-visible:shadow-md',
                errors.email && 'border-red-400 focus-visible:border-red-500 focus-visible:ring-red-500/20'
              )}
            />
            {errors.email && (
              <p className="text-xs font-light text-red-600 mt-2 animate-in fade-in">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-3">
            <Label htmlFor="password" className="text-sm font-medium text-gray-700">
              Senha
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              {...register('password')}
              className={cn(
                'h-14 text-base border-gray-200/80 transition-all duration-200',
                'hover:border-gray-400 hover:shadow-sm',
                'focus-visible:border-gray-900 focus-visible:ring-4 focus-visible:ring-gray-900/10 focus-visible:shadow-md',
                errors.password && 'border-red-400 focus-visible:border-red-500 focus-visible:ring-red-500/20'
              )}
            />
            {errors.password && (
              <p className="text-xs font-light text-red-600 mt-2 animate-in fade-in">{errors.password.message}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full h-14 text-base font-medium tracking-wide mt-10 bg-gray-900 hover:bg-gray-800 active:bg-gray-950 active:scale-[0.99] transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-md"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

