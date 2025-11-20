export type UserRole = 'admin' | 'operador' | 'vendedor'

export interface AuthUser {
  id: string
  email: string
  name: string
  role: UserRole
  storeId: string
}

export interface JwtPayload {
  sub: string
  storeId: string
  role: UserRole
  exp: number
  iat: number
}

export interface LoginInput {
  email: string
  password: string
}

