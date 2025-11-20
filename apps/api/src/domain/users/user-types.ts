import type { UserRole } from '../auth/auth-types'

export interface User {
  id: string
  store_id: string
  name: string
  email: string
  password_hash: string
  role: UserRole
  created_at: Date
}

export interface UserWithStore {
  id: string
  store_id: string
  name: string
  email: string
  password_hash: string
  role: UserRole
  created_at: Date
  store: {
    id: string
    name: string
    domain: string
    active: boolean
  }
}

