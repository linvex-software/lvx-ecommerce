import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api-client'

export interface User {
  id: string
  store_id: string | null
  name: string
  email: string
  role: 'admin' | 'operador' | 'vendedor'
  created_at: string
}

export interface CreateUserInput {
  name: string
  email: string
  password: string
  role: 'admin' | 'operador' | 'vendedor'
}

const USERS_QUERY_KEY = ['users']

export function useUsers() {
  return useQuery({
    queryKey: USERS_QUERY_KEY,
    queryFn: async () => {
      const response = await apiClient.get<{ users: User[] }>('/admin/users')
      return response.data
    }
  })
}

export function useCreateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateUserInput) => {
      const response = await apiClient.post<{ user: User }>('/admin/users', input)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY })
      toast.success('Usuário criado com sucesso!')
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || 'Erro ao criar usuário'
      toast.error('Erro ao criar usuário', {
        description: errorMessage
      })
    }
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/admin/users/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY })
      toast.success('Usuário excluído com sucesso!')
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || 'Erro ao excluir usuário'
      toast.error('Erro ao excluir usuário', {
        description: errorMessage
      })
    }
  })
}

