import { z } from 'zod'
import type { UserRepository } from '../../../infra/db/repositories/user-repository'
import type { User } from '../../../domain/users/user-types'

export const createUserSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  role: z.enum(['admin', 'operador', 'vendedor'])
})

export interface CreateUserDependencies {
  userRepository: UserRepository
}

export async function createUserUseCase(
  input: z.infer<typeof createUserSchema>,
  storeId: string,
  dependencies: CreateUserDependencies
): Promise<User> {
  const { userRepository } = dependencies

  // Verificar se email já existe nesta loja
  const existingUser = await userRepository.findByEmailWithStore(input.email, storeId)
  if (existingUser) {
    throw new Error('Email already in use in this store')
  }

  const user = await userRepository.create({
    store_id: storeId,
    name: input.name,
    email: input.email,
    password: input.password,
    role: input.role
  })

  return user
}

