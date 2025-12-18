import type { UserRepository } from '../../../infra/db/repositories/user-repository'
import type { User } from '../../../domain/users/user-types'

export interface ListVendorsDependencies {
  userRepository: UserRepository
}

export async function listVendorsUseCase(
  storeId: string,
  dependencies: ListVendorsDependencies
): Promise<{ vendors: Omit<User, 'password_hash'>[] }> {
  const { userRepository } = dependencies

  const vendors = await userRepository.listVendorsByStore(storeId)

  return { vendors }
}

