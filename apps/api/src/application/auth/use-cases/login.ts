import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'
import { UserRepository } from '../../../infra/db/repositories/user-repository'
import { AuthSessionRepository } from '../../../infra/db/repositories/auth-session-repository'
import type { LoginInput, AuthUser } from '../../../domain/auth/auth-types'

export interface LoginResult {
  accessToken: string
  refreshToken: string
  user: AuthUser
}

export interface LoginDependencies {
  userRepository: UserRepository
  authSessionRepository: AuthSessionRepository
  jwtSign: (payload: { sub: string; storeId: string; role: string }) => Promise<string>
}

export async function loginUseCase(
  input: LoginInput,
  storeId: string,
  dependencies: LoginDependencies
): Promise<LoginResult> {
  const { userRepository, authSessionRepository, jwtSign } = dependencies

  const userWithStore = await userRepository.findByEmailWithStore(
    input.email,
    storeId
  )

  if (!userWithStore) {
    throw new Error('Invalid credentials')
  }

  if (!userWithStore.store.active) {
    throw new Error('Store is not active')
  }

  const passwordMatch = await bcrypt.compare(
    input.password,
    userWithStore.password_hash
  )

  if (!passwordMatch) {
    throw new Error('Invalid credentials')
  }

  const accessToken = await jwtSign({
    sub: userWithStore.id,
    storeId: userWithStore.store_id,
    role: userWithStore.role
  })

  const refreshToken = randomUUID()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 30)

  await authSessionRepository.createSession({
    user_id: userWithStore.id,
    store_id: userWithStore.store_id,
    refresh_token: refreshToken,
    expires_at: expiresAt
  })

  return {
    accessToken,
    refreshToken,
    user: {
      id: userWithStore.id,
      email: userWithStore.email,
      name: userWithStore.name,
      role: userWithStore.role,
      storeId: userWithStore.store_id
    }
  }
}

