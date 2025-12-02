import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { CustomerRepository } from '../../../infra/db/repositories/customer-repository'

const updateCustomerPasswordSchema = z.object({
  current_password: z.string().min(1, 'Senha atual é obrigatória'),
  new_password: z.string().min(6, 'Nova senha deve ter pelo menos 6 caracteres')
})

export interface UpdateCustomerPasswordDependencies {
  customerRepository: CustomerRepository
}

export async function updateCustomerPasswordUseCase(
  customerId: string,
  storeId: string,
  input: z.infer<typeof updateCustomerPasswordSchema>,
  dependencies: UpdateCustomerPasswordDependencies
): Promise<void> {
  const { customerRepository } = dependencies

  // Validar input
  const validated = updateCustomerPasswordSchema.parse(input)

  // Buscar cliente para verificar senha atual
  const customer = await customerRepository.findById(customerId, storeId)
  if (!customer) {
    throw new Error('Customer not found')
  }

  if (!customer.password_hash) {
    throw new Error('Cliente não possui senha cadastrada')
  }

  // Verificar senha atual
  const passwordMatch = await bcrypt.compare(
    validated.current_password,
    customer.password_hash
  )

  if (!passwordMatch) {
    throw new Error('Senha atual incorreta')
  }

  // Gerar hash da nova senha
  const newPasswordHash = await bcrypt.hash(validated.new_password, 10)

  // Atualizar senha
  await customerRepository.updatePassword(customerId, storeId, newPasswordHash)
}

export { updateCustomerPasswordSchema }

