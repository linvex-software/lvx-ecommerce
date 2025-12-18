import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../api-client'

export interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'operador' | 'vendedor'
  created_at: string
}

export interface UsersResponse {
  users: User[]
}

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await apiClient.get<UsersResponse>('/admin/users')
      return response.data
    }
  })
}

export function useSellers() {
  const { data, ...rest } = useUsers()
  return {
    ...rest,
    data: data ? { users: data.users.filter((user) => user.role === 'vendedor') } : undefined
  }
}

