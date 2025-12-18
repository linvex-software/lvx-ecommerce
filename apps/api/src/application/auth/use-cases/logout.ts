import { AuthSessionRepository } from '../../../infra/db/repositories/auth-session-repository'

export interface LogoutDependencies {
  authSessionRepository: AuthSessionRepository
  revokeAll?: boolean
}

export async function logoutUseCase(
  refreshToken: string,
  userId: string,
  dependencies: LogoutDependencies
): Promise<void> {
  const { authSessionRepository, revokeAll = false } = dependencies

  if (revokeAll) {
    await authSessionRepository.revokeAllByUser(userId)
    return
  }

  const session = await authSessionRepository.findByToken(refreshToken)

  if (session) {
    await authSessionRepository.revokeById(session.id)
  }
}

