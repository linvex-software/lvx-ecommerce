'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { loginSchema, type LoginInput } from '@white-label/types'
import { apiClient } from '@/lib/api-client'
import { useAuthStore } from '@/store/auth-store'
import { Button } from '@white-label/ui'
import { cn } from '@white-label/ui'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface LoginResponse {
  accessToken: string
  user: {
    id: string
    name: string
    email: string
    role: 'admin' | 'operador' | 'vendedor'
    storeId: string
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
      // Obter storeId do localStorage ou de algum lugar (por enquanto, pode ser hardcoded para teste)
      // Em produção, isso viria de um subdomínio ou configuração
      const storeId = localStorage.getItem('storeId') || '34c236fc-6f43-49de-aea4-4ad4ff2f4323'

      const response = await apiClient.post<LoginResponse>('/auth/login', data, {
        headers: {
          'x-store-id': storeId
        }
      })

      return response.data
    },
    onSuccess: (data) => {
      setSession(data.user, data.accessToken, data.user.storeId)
      router.push('/dashboard')
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
    <Card className="w-full border-0 shadow-[0_8px_30px_rgb(0,0,0,0.06)] bg-white/80 backdrop-blur-sm">
      <CardHeader className="space-y-2 pb-8 pt-10">
        <CardTitle className="text-2xl font-light tracking-tight text-gray-900 text-center">
          Acessar painel
        </CardTitle>
        <CardDescription className="text-center text-sm font-light text-gray-500">
          Entre com suas credenciais para continuar
        </CardDescription>
      </CardHeader>
      <CardContent className="px-10 pb-10">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="rounded-lg bg-red-50/80 border border-red-200/50 px-4 py-3 text-sm text-red-700 font-light">
              {error}
            </div>
          )}

          <div className="space-y-2.5">
            <Label htmlFor="email" className="text-sm font-light text-gray-700">
              E-mail
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              {...register('email')}
              className={cn(
                'h-12 border-gray-200 focus-visible:border-gray-400 focus-visible:ring-gray-200',
                errors.email && 'border-red-300 focus-visible:border-red-400'
              )}
            />
            {errors.email && (
              <p className="text-xs font-light text-red-600 mt-1.5">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2.5">
            <Label htmlFor="password" className="text-sm font-light text-gray-700">
              Senha
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              {...register('password')}
              className={cn(
                'h-12 border-gray-200 focus-visible:border-gray-400 focus-visible:ring-gray-200',
                errors.password && 'border-red-300 focus-visible:border-red-400'
              )}
            />
            {errors.password && (
              <p className="text-xs font-light text-red-600 mt-1.5">{errors.password.message}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full h-12 text-sm font-light tracking-wide mt-8 bg-gray-900 hover:bg-gray-800 transition-colors"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

