import type { UserRole } from './auth-types'

/**
 * Verifica se o usuário é admin
 */
export function isAdmin(user: { role: UserRole }): boolean {
  return user.role === 'admin'
}

/**
 * Verifica se o usuário tem uma das roles necessárias
 */
export function can(user: { role: UserRole }, requiredRoles: UserRole[]): boolean {
  return requiredRoles.includes(user.role)
}

/**
 * Verifica se o usuário é admin ou operador
 */
export function isAdminOrOperator(user: { role: UserRole }): boolean {
  return user.role === 'admin' || user.role === 'operador'
}

/**
 * Verifica se o usuário é vendedor ou operador
 */
export function isSellerOrOperator(user: { role: UserRole }): boolean {
  return user.role === 'vendedor' || user.role === 'operador'
}

