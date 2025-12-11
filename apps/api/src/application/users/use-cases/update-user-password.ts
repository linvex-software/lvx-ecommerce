import { z } from 'zod'
import bcrypt from 'bcryptjs'
import type { UserRepository } from '../../../infra/db/repositories/user-repository'

const updateUserPasswordSchema = z.object({
  new_password: z.string().min(6, 'Nova senha deve ter pelo menos 6 caracteres')
})

export interface UpdateUserPasswordDependencies {
  userRepository: UserRepository
}

export async function updateUserPasswordUseCase(
  userId: string,
  storeId: string,
  input: z.infer<typeof updateUserPasswordSchema>,
  dependencies: UpdateUserPasswordDependencies
): Promise<void> {
  const { userRepository } = dependencies

  // Validar input
  const validated = updateUserPasswordSchema.parse(input)

  // Verificar se usuário existe
  const user = await userRepository.findById(userId, storeId)
  if (!user) {
    throw new Error('User not found')
  }

  // Gerar hash da nova senha
  const newPasswordHash = await bcrypt.hash(validated.new_password, 10)

  // Atualizar senha
  await userRepository.updatePassword(userId, storeId, newPasswordHash)
}

export { updateUserPasswordSchema }

