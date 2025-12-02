import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { fetchAPI } from '@/lib/api'
import { useAuthStore } from '@/lib/store/useAuthStore'

interface LoginInput {
  identifier: string // Pode ser email ou CPF
  password: string
}

interface LoginResponse {
  accessToken: string
  customer: {
    id: string
    store_id: string
    name: string
    email: string | null
    cpf: string
    phone: string | null
    created_at: string
  }
}

export function useLogin() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { setAuth } = useAuthStore()

  const login = async (input: LoginInput) => {
    setIsLoading(true)
    setError(null)

    try {
      // Detectar se é email ou CPF
      const isEmail = input.identifier.includes('@')
      const identifier = isEmail 
        ? input.identifier.trim() 
        : input.identifier.replace(/\D/g, '') // Normalizar CPF

      const data = await fetchAPI('/customers/login', {
        method: 'POST',
        body: JSON.stringify({
          identifier, // Pode ser email ou CPF
          password: input.password,
        }),
      }) as LoginResponse

      setAuth(data.accessToken, data.customer)
      router.push('/minha-conta')
    } catch (err: any) {
      // Extrair mensagem de erro de forma mais amigável
      let message = 'Erro ao fazer login'
      
      // Priorizar payload se disponível
      if (err.payload?.error) {
        message = err.payload.error
      } else if (err.message) {
        // Se a mensagem já vem formatada do fetchAPI
        if (err.message.includes('API Error:')) {
          const parts = err.message.split('API Error:')
          if (parts.length > 1) {
            message = parts[1].trim()
          }
        } else {
          message = err.message
        }
      }
      
      // Se houver detalhes de validação, usar a primeira mensagem
      if (err.payload?.details && Array.isArray(err.payload.details) && err.payload.details.length > 0) {
        const firstError = err.payload.details[0]
        if (firstError.message) {
          message = firstError.message
        }
      }
      
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  return { login, isLoading, error }
}

