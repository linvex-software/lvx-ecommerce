import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
})

export type LoginInput = z.infer<typeof loginSchema>

export interface AuthUser {
  id: string
  name: string
  email: string
  role: 'admin' | 'operador' | 'vendedor'
  storeId: string
}

