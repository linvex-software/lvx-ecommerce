import type { UserRole } from '../auth/auth-types'

export interface User {
  id: string
  store_id: string | null // Pode ser null se usuário ainda não tem loja
  name: string
  email: string
  password_hash: string
  role: UserRole | null // Pode ser null se usuário ainda não tem loja
  created_at: Date
}

export interface UserWithStore {
  id: string
  store_id: string | null
  name: string
  email: string
  password_hash: string
  role: UserRole | null
  created_at: Date
  store: {
    id: string
    name: string
    domain: string
    active: boolean
  } | null // null se usuário ainda não tem loja
}

