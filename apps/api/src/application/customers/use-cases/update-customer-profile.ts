import { z } from 'zod'
import { CustomerRepository } from '../../../infra/db/repositories/customer-repository'
import type {
  Customer,
  UpdateCustomerProfileInput
} from '../../../domain/customers/customer-types'

const updateCustomerProfileSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres').optional(),
  email: z.string().email('Email inválido').optional().nullable(),
  phone: z.string().optional().nullable()
})

export interface UpdateCustomerProfileDependencies {
  customerRepository: CustomerRepository
}

export async function updateCustomerProfileUseCase(
  customerId: string,
  storeId: string,
  input: UpdateCustomerProfileInput,
  dependencies: UpdateCustomerProfileDependencies
): Promise<Customer> {
  const { customerRepository } = dependencies

  // Validar input
  const validated = updateCustomerProfileSchema.parse(input)

  // Verificar se email já existe (se fornecido e diferente do atual)
  if (validated.email !== undefined) {
    const existingCustomer = await customerRepository.findByEmail(
      validated.email,
      storeId
    )
    if (existingCustomer && existingCustomer.id !== customerId) {
      throw new Error('Email já cadastrado nesta loja')
    }
  }

  // Atualizar perfil
  const customer = await customerRepository.update(
    customerId,
    storeId,
    validated
  )

  return customer
}

export { updateCustomerProfileSchema }

