import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
})

export type LoginInput = z.infer<typeof loginSchema>

export interface Store {
  id: string
  name: string
  domain: string
  active: boolean
}

export interface AuthUser {
  id: string
  name: string
  email: string
  role?: 'admin' | 'operador' | 'vendedor' // Role opcional (null se não tem loja ainda)
  storeId?: string // ID da store (null se não tem loja ainda)
  store?: Store // Store do usuário (null se não tem loja ainda)
}

