'use client'

import { useEffect, useState, useRef } from 'react'
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

  const nameInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<StoreFormData>({
    resolver: zodResolver(storeSchema)
  })

  const { ref: nameRef, ...nameRegisterProps } = register('name')

  // Foco automático no primeiro input quando montar
  useEffect(() => {
    if (isMounted && nameInputRef.current) {
      // Pequeno delay para garantir que o componente está totalmente renderizado
      const timer = setTimeout(() => {
        nameInputRef.current?.focus()
      }, 150)
      return () => clearTimeout(timer)
    }
  }, [isMounted])

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

  // Handler para Enter no formulário
  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !isSubmitting) {
      e.preventDefault()
      handleSubmit(onSubmit)()
    }
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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-gray-50 to-slate-50 px-4 py-8 sm:py-16">
      <div className="w-full max-w-lg space-y-8 sm:space-y-12">
        {/* Header com branding */}
        <div className="text-center space-y-3 sm:space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
          <h1 className="text-5xl sm:text-6xl font-light tracking-tight text-gray-900">
            LVX Commerce
          </h1>
          <p className="text-base sm:text-sm font-light text-gray-600 tracking-wide">
            Painel Administrativo
          </p>
        </div>

        {/* Card do formulário */}
        <Card className="w-full rounded-2xl border border-gray-200/80 shadow-[0_20px_60px_rgba(0,0,0,0.12)] bg-white/95 backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-500 delay-75">
          <CardHeader className="space-y-3 pb-10 pt-12 px-6 sm:px-12">
            <CardTitle className="text-3xl sm:text-3xl font-normal tracking-tight text-gray-900 text-center">
              Crie sua loja
            </CardTitle>
            <CardDescription className="text-center text-sm font-light text-gray-500 mt-2">
              Configure sua primeira loja e comece a vender com a LVX Commerce.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 sm:px-12 pb-12">
            <form onSubmit={handleSubmit(onSubmit)} onKeyDown={handleKeyDown} className="space-y-6">
              {error && (
                <div className="rounded-lg bg-red-50/90 border border-red-200/60 px-4 py-3 text-sm text-red-700 font-light animate-in fade-in">
                  {error}
                </div>
              )}

              <div className="space-y-3">
                <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                  Nome da loja
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Minha Loja"
                  autoComplete="organization"
                  {...nameRegisterProps}
                  ref={(e) => {
                    nameRef(e)
                    if (e) {
                      (nameInputRef as React.MutableRefObject<HTMLInputElement | null>).current = e
                    }
                  }}
                  className={cn(
                    'h-14 text-base border-gray-200/80 transition-all duration-200',
                    'hover:border-gray-400 hover:shadow-sm',
                    'focus-visible:border-gray-900 focus-visible:ring-4 focus-visible:ring-gray-900/10 focus-visible:shadow-md',
                    errors.name && 'border-red-400 focus-visible:border-red-500 focus-visible:ring-red-500/20'
                  )}
                />
                {errors.name && (
                  <p className="text-xs font-light text-red-600 mt-2 animate-in fade-in">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-3">
                <Label htmlFor="domain" className="text-sm font-medium text-gray-700">
                  Domínio / Slug
                </Label>
                <Input
                  id="domain"
                  type="text"
                  placeholder="minha-loja"
                  autoComplete="off"
                  {...register('domain')}
                  className={cn(
                    'h-14 text-base border-gray-200/80 transition-all duration-200',
                    'hover:border-gray-400 hover:shadow-sm',
                    'focus-visible:border-gray-900 focus-visible:ring-4 focus-visible:ring-gray-900/10 focus-visible:shadow-md',
                    errors.domain && 'border-red-400 focus-visible:border-red-500 focus-visible:ring-red-500/20'
                  )}
                />
                {errors.domain && (
                  <p className="text-xs font-light text-red-600 mt-2 animate-in fade-in">{errors.domain.message}</p>
                )}
                <p className="text-xs font-light text-gray-500 mt-1">
                  Apenas letras minúsculas, números e hífens. Ex: minha-loja
                </p>
              </div>

              <Button
                type="submit"
                className="w-full h-14 text-base font-medium tracking-wide mt-10 bg-gray-900 hover:bg-gray-800 active:bg-gray-950 active:scale-[0.99] transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-md"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Criando...' : 'Criar loja'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

