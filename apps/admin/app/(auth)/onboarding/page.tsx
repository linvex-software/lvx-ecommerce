'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuthStore } from '@/store/auth-store'
import { useMutation } from '@tanstack/react-query'
import axios from 'axios'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@white-label/ui'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@white-label/ui'

const storeSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  domain: z
    .string()
    .min(3, 'Domain deve ter pelo menos 3 caracteres')
    .regex(/^[a-z0-9-]+$/, 'Domain deve conter apenas letras minúsculas, números e hífens')
})

type StoreFormData = z.infer<typeof storeSchema>

export default function OnboardingPage() {
  const router = useRouter()
  const { user, accessToken, setSession } = useAuthStore()
  const [error, setError] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<StoreFormData>({
    resolver: zodResolver(storeSchema)
  })

  // Aguardar hidratação do Zustand
  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    // Aguardar hidratação antes de fazer verificações
    if (!isMounted) return

    // Se não houver usuário, redirecionar para login
    if (!user) {
      router.push('/login')
      return
    }

    // Se já tiver store, redirecionar para página da loja
    if (user.store || user.storeId) {
      router.push('/store')
      return
    }
  }, [isMounted, user, router])

  const createStoreMutation = useMutation({
    mutationFn: async (data: StoreFormData) => {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'
      
      const response = await axios.post<{
        store: {
          id: string
          name: string
          domain: string
          active: boolean
        }
        accessToken: string
        user: {
          id: string
          email: string
          name: string
          role?: 'admin' | 'operador' | 'vendedor'
          storeId?: string
          store?: {
            id: string
            name: string
            domain: string
            active: boolean
          }
        }
      }>(
        `${API_URL}/stores`,
        data,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: accessToken ? `Bearer ${accessToken}` : undefined
          },
          withCredentials: true
        }
      )

      return response.data
    },
    onSuccess: (data) => {
      setSession(data.user, data.accessToken, data.user.storeId)
      router.push('/store')
    },
    onError: (error: unknown) => {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { error?: string } } }
        setError(axiosError.response?.data?.error || 'Erro ao criar loja')
      } else {
        setError('Erro ao criar loja. Tente novamente.')
      }
    }
  })

  const onSubmit = (data: StoreFormData) => {
    setError(null)
    createStoreMutation.mutate(data)
  }

  // Aguardar hidratação antes de renderizar para evitar problemas de hidratação
  if (!isMounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="text-sm font-light text-gray-500 tracking-wide">Carregando...</div>
      </div>
    )
  }

  // Se não houver usuário após hidratação, mostrar loading (o useEffect vai redirecionar)
  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="text-sm font-light text-gray-500 tracking-wide">Carregando...</div>
      </div>
    )
  }

  // Se já tiver store, mostrar loading (o useEffect vai redirecionar)
  if (user.store || user.storeId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="text-sm font-light text-gray-500 tracking-wide">Redirecionando...</div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50 px-4 py-16">
      <Card className="w-full max-w-md border-0 shadow-[0_8px_30px_rgb(0,0,0,0.06)] bg-white/80 backdrop-blur-sm">
        <CardHeader className="space-y-2 pb-8 pt-10">
          <CardTitle className="text-2xl font-light tracking-tight text-gray-900 text-center">
            Criar sua loja
          </CardTitle>
          <CardDescription className="text-center text-sm font-light text-gray-500">
            Configure sua primeira loja para começar a usar o sistema.
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
              <Label htmlFor="name" className="text-sm font-light text-gray-700">
                Nome da loja
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="Minha Loja"
                {...register('name')}
                className={cn(
                  'h-12 border-gray-200 focus-visible:border-gray-400 focus-visible:ring-gray-200',
                  errors.name && 'border-red-300 focus-visible:border-red-400'
                )}
              />
              {errors.name && (
                <p className="text-xs font-light text-red-600 mt-1.5">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2.5">
              <Label htmlFor="domain" className="text-sm font-light text-gray-700">
                Domain/Slug
              </Label>
              <Input
                id="domain"
                type="text"
                placeholder="minha-loja"
                {...register('domain')}
                className={cn(
                  'h-12 border-gray-200 focus-visible:border-gray-400 focus-visible:ring-gray-200',
                  errors.domain && 'border-red-300 focus-visible:border-red-400'
                )}
              />
              {errors.domain && (
                <p className="text-xs font-light text-red-600 mt-1.5">{errors.domain.message}</p>
              )}
              <p className="text-xs font-light text-gray-500">
                Apenas letras minúsculas, números e hífens. Ex: minha-loja
              </p>
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-sm font-light tracking-wide mt-8 bg-gray-900 hover:bg-gray-800 transition-colors"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Criando...' : 'Criar loja'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

