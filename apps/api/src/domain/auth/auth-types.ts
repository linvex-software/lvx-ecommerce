export type UserRole = 'admin' | 'operador' | 'vendedor'

export interface Store {
  id: string
  name: string
  domain: string
  active: boolean
}

export interface AuthUser {
  id: string
  email: string
  name: string
  role?: UserRole // Role opcional (null se não tem loja ainda)
  storeId?: string // ID da store (null se não tem loja ainda)
  store?: Store // Store do usuário (null se não tem loja ainda)
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

