import { randomUUID } from 'crypto'
import { UserRepository } from '../../../infra/db/repositories/user-repository'
import { AuthSessionRepository } from '../../../infra/db/repositories/auth-session-repository'
import type { AuthUser } from '../../../domain/auth/auth-types'

export interface RefreshTokenResult {
  accessToken: string
  refreshToken?: string
  user: AuthUser
}

export interface RefreshTokenDependencies {
  userRepository: UserRepository
  authSessionRepository: AuthSessionRepository
  jwtSign: (payload: { sub: string; storeId: string; role: string }) => Promise<string>
}

export async function refreshTokenUseCase(
  refreshToken: string,
  dependencies: RefreshTokenDependencies
): Promise<RefreshTokenResult> {
  const { userRepository, authSessionRepository, jwtSign } = dependencies

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

  // Validar que é sessão de usuário interno (não cliente)
  if (!session.user_id || session.customer_id) {
    throw new Error('Invalid refresh token')
  }

  const user = await userRepository.findById(session.user_id, session.store_id)

  if (!user) {
    throw new Error('User not found')
  }

  const accessToken = await jwtSign({
    sub: user.id,
    storeId: user.store_id,
    role: user.role
  })

  const newRefreshToken = randomUUID()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 30)

  await authSessionRepository.revokeById(session.id)
  await authSessionRepository.createSession({
    user_id: user.id,
    store_id: user.store_id,
    refresh_token: newRefreshToken,
    expires_at: expiresAt
  })

  return {
    accessToken,
    refreshToken: newRefreshToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      storeId: user.store_id
    }
  }
}

