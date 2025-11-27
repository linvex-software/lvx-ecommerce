import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'
import { UserRepository } from '../../../infra/db/repositories/user-repository'
import { AuthSessionRepository } from '../../../infra/db/repositories/auth-session-repository'
import type { LoginInput, AuthUser } from '../../../domain/auth/auth-types'

export interface LoginResult {
  accessToken?: string
  refreshToken?: string
  user: AuthUser
}

export interface LoginDependencies {
  userRepository: UserRepository
  authSessionRepository: AuthSessionRepository
  jwtSign: (payload: { sub: string; storeId?: string; role?: string }) => Promise<string>
}

export async function loginUseCase(
  input: LoginInput,
  dependencies: LoginDependencies
): Promise<LoginResult> {
  const { userRepository, authSessionRepository, jwtSign } = dependencies

  // Buscar usuário por email
  const userWithStore = await userRepository.findByEmail(input.email)

  if (!userWithStore) {
    throw new Error('Invalid credentials')
  }

  // Validar senha
  if (!userWithStore.password_hash) {
    throw new Error('Invalid credentials')
  }

  const passwordMatch = await bcrypt.compare(
    input.password,
    userWithStore.password_hash
  )

  if (!passwordMatch) {
    throw new Error('Invalid credentials')
  }

  // Se usuário não tem loja, retornar sem token para ir para onboarding
  if (!userWithStore.store_id || !userWithStore.store || !userWithStore.role) {
    const tempAccessToken = await jwtSign({
      sub: userWithStore.id
    })

    return {
      accessToken: tempAccessToken,
      user: {
        id: userWithStore.id,
        email: userWithStore.email,
        name: userWithStore.name
      }
    }
  }

  // Verificar se a store está ativa
  if (!userWithStore.store.active) {
    throw new Error('Store is not active')
  }

  // Usuário tem loja - gerar token completo
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
      storeId: userWithStore.store_id,
      store: {
        id: userWithStore.store.id,
        name: userWithStore.store.name,
        domain: userWithStore.store.domain,
        active: userWithStore.store.active
      }
    }
  }
}

