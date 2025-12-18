import { useState, useEffect } from 'react'
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

  // Limpar erro automaticamente após 3 segundos
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [error])

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
      // Usar CPF normalizado como identifier (a API aceita email ou CPF)
      const normalizedCpf = input.cpf.replace(/\D/g, '')
      const loginData = await fetchAPI('/customers/login', {
        method: 'POST',
        body: JSON.stringify({
          identifier: normalizedCpf, // API espera 'identifier', não 'cpf'
          password: input.password,
        }),
      }) as LoginResponse

      // 3. Salvar token e dados do cliente
      setAuth(loginData.accessToken, loginData.customer)

      return loginData
    } catch (err: any) {
      // Debug: logar o erro completo para entender a estrutura
      console.log('[useRegister] Erro capturado:', {
        message: err.message,
        payload: err.payload,
        details: err.payload?.details,
        fullError: err
      })
      
      // Extrair mensagem de erro de forma mais amigável
      let message = 'Erro ao criar conta. Tente novamente.'
      
      // Priorizar detalhes de validação se disponível (contém mensagens específicas)
      if (err.payload?.details && Array.isArray(err.payload.details) && err.payload.details.length > 0) {
        // Pegar a primeira mensagem de erro dos detalhes
        const firstError = err.payload.details[0]
        console.log('[useRegister] Primeiro erro dos detalhes:', firstError)
        
        if (firstError.message) {
          // Usar a mensagem específica do erro (ex: "CPF inválido")
          message = firstError.message
          console.log('[useRegister] Usando mensagem específica:', message)
        } else if (firstError.path && firstError.path.length > 0) {
          // Construir mensagem baseada no campo se não houver mensagem
          const field = firstError.path[firstError.path.length - 1]
          const fieldName = field === 'cpf' ? 'CPF' : 
                           field === 'email' ? 'E-mail' : 
                           field === 'password' ? 'Senha' : 
                           field === 'name' ? 'Nome' : 
                           field === 'phone' ? 'Telefone' : field
          message = `${fieldName}: Campo inválido`
        }
      } else if (err.payload?.error) {
        // Se não houver detalhes, usar o erro geral
        // Mas só se não for "Validation error" genérico
        if (err.payload.error !== 'Validation error') {
          message = err.payload.error
        }
      } else if (err.message) {
        // Se a mensagem já vem formatada do fetchAPI
        if (err.message.includes('API Error:')) {
          const parts = err.message.split('API Error:')
          if (parts.length > 1) {
            message = parts[1].trim()
          }
        } else {
          // Traduzir mensagens comuns
          if (err.message.includes('já cadastrado')) {
            message = err.message
          } else if (err.message.includes('CPF inválido')) {
            message = 'CPF inválido. Verifique os dados e tente novamente.'
          } else if (err.message.includes('Email inválido')) {
            message = 'E-mail inválido. Verifique os dados e tente novamente.'
          } else if (err.message.includes('Validation error')) {
            message = 'Dados inválidos. Verifique os campos e tente novamente.'
          } else {
            message = err.message
          }
        }
      }
      
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  return { register, isLoading, error }
}

