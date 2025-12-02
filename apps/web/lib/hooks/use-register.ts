import { useState } from 'react'
import { fetchAPI } from '@/lib/api'
import { useAuthStore } from '@/lib/store/useAuthStore'

interface RegisterInput {
  name: string
  cpf: string
  email?: string | null
  phone?: string | null
  password: string
}

interface RegisterResponse {
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

export function useRegister() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { setAuth } = useAuthStore()

  const register = async (input: RegisterInput) => {
    setIsLoading(true)
    setError(null)

    try {
      // 1. Registrar cliente
      await fetchAPI('/customers/register', {
        method: 'POST',
        body: JSON.stringify({
          name: input.name,
          cpf: input.cpf.replace(/\D/g, ''), // Normalizar CPF
          email: input.email || null,
          phone: input.phone || null,
          password: input.password,
        }),
      }) as RegisterResponse

      // 2. Fazer login automático para obter token
      const loginData = await fetchAPI('/customers/login', {
        method: 'POST',
        body: JSON.stringify({
          cpf: input.cpf.replace(/\D/g, ''),
          password: input.password,
        }),
      }) as LoginResponse

      // 3. Salvar token e dados do cliente
      setAuth(loginData.accessToken, loginData.customer)

      return loginData
    } catch (err: any) {
      const message = err.message || 'Erro ao criar conta'
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  return { register, isLoading, error }
}

