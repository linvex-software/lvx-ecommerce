import { randomUUID } from 'crypto'
import { CustomerRepository } from '../../../infra/db/repositories/customer-repository'
import { AuthSessionRepository } from '../../../infra/db/repositories/auth-session-repository'
import type { CustomerProfile } from '../../../domain/customers/customer-types'

export interface RefreshCustomerTokenResult {
  accessToken: string
  refreshToken: string
  customer: CustomerProfile
}

export interface RefreshCustomerTokenDependencies {
  customerRepository: CustomerRepository
  authSessionRepository: AuthSessionRepository
  jwtSign: (payload: {
    sub: string
    storeId: string
    type: 'customer'
  }) => Promise<string>
}

export async function refreshCustomerTokenUseCase(
  refreshToken: string,
  dependencies: RefreshCustomerTokenDependencies
): Promise<RefreshCustomerTokenResult> {
  const { customerRepository, authSessionRepository, jwtSign } = dependencies

  const session = await authSessionRepository.findByToken(refreshToken)

  if (!session) {
    throw new Error('Invalid refresh token')
  }

  if (session.revoked_at) {
    throw new Error('Session revoked')
  }

  if (session.expires_at < new Date()) {
    throw new Error('Session expired')
  }

  // Validar que é sessão de customer (não usuário interno)
  if (!session.customer_id || session.user_id) {
    throw new Error('Invalid refresh token')
  }

  const customer = await customerRepository.findById(session.customer_id, session.store_id)

  if (!customer) {
    throw new Error('Customer not found')
  }

  // Gerar novo access token
  const accessToken = await jwtSign({
    sub: customer.id,
    storeId: customer.store_id,
    type: 'customer'
  })

  // Gerar novo refresh token
  const newRefreshToken = randomUUID()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 30)

  // Revogar sessão antiga e criar nova
  await authSessionRepository.revokeById(session.id)
  await authSessionRepository.createCustomerSession({
    customer_id: customer.id,
    store_id: customer.store_id,
    refresh_token: newRefreshToken,
    expires_at: expiresAt
  })

  return {
    accessToken,
    refreshToken: newRefreshToken,
    customer: {
      id: customer.id,
      store_id: customer.store_id,
      name: customer.name,
      email: customer.email,
      cpf: customer.cpf,
      phone: customer.phone,
      created_at: customer.created_at
    }
  }
}

