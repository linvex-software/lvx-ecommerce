import { z } from 'zod'
import { CustomerRepository } from '../../../infra/db/repositories/customer-repository'
import {
  normalizeCPF,
  validateCPF
} from '../../../domain/customers/customer-helpers'
import type {
  Customer,
  RegisterCustomerInput
} from '../../../domain/customers/customer-types'

const registerCustomerSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  cpf: z.string().refine(validateCPF, 'CPF inválido'),
  email: z.string().email('Email inválido').optional().nullable(),
  phone: z.string().optional().nullable(),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres')
})

export interface RegisterCustomerDependencies {
  customerRepository: CustomerRepository
}

export interface RegisterCustomerResult {
  customer: Customer
}

export async function registerCustomerUseCase(
  input: RegisterCustomerInput,
  storeId: string,
  dependencies: RegisterCustomerDependencies
): Promise<RegisterCustomerResult> {
  const { customerRepository } = dependencies

  // Validar input
  const validated = registerCustomerSchema.parse(input)

  // Normalizar CPF
  const normalizedCpf = normalizeCPF(validated.cpf)

  // Verificar se CPF já existe na loja
  const existingByCpf = await customerRepository.findByCpf(normalizedCpf, storeId)
  if (existingByCpf) {
    throw new Error('CPF já cadastrado nesta loja')
  }

  // Verificar se email já existe na loja (se fornecido)
  if (validated.email) {
    const existingByEmail = await customerRepository.findByEmail(
      validated.email,
      storeId
    )
    if (existingByEmail) {
      throw new Error('Email já cadastrado nesta loja')
    }
  }

  // Criar customer
  const customer = await customerRepository.create(
    {
      ...validated,
      cpf: normalizedCpf
    },
    storeId
  )

  return {
    customer
  }
}

export { registerCustomerSchema }

