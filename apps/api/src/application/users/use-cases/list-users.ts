import type { UserRepository } from '../../../infra/db/repositories/user-repository'
import type { User } from '../../../domain/users/user-types'

export interface ListUsersDependencies {
  userRepository: UserRepository
}

export async function listUsersUseCase(
  storeId: string,
  dependencies: ListUsersDependencies
): Promise<{ users: User[] }> {
  const { userRepository } = dependencies

  const users = await userRepository.listByStore(storeId)

  return { users }
}

