import { z } from 'zod'
import { CustomerRepository } from '../../../infra/db/repositories/customer-repository'
import {
  normalizeCPF,
  validateCPF
} from '../../../domain/customers/customer-helpers'
import type { Customer } from '../../../domain/customers/customer-types'

const createQuickCustomerSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  cpf: z.string().refine(validateCPF, 'CPF inválido'),
  email: z.string().email('Email inválido').optional().nullable(),
  phone: z.string().optional().nullable()
})

export interface CreateQuickCustomerDependencies {
  customerRepository: CustomerRepository
}

export interface CreateQuickCustomerResult {
  customer: Customer
}

export async function createQuickCustomerUseCase(
  input: z.infer<typeof createQuickCustomerSchema>,
  storeId: string,
  dependencies: CreateQuickCustomerDependencies
): Promise<CreateQuickCustomerResult> {
  const { customerRepository } = dependencies

  // Validar input
  const validated = createQuickCustomerSchema.parse(input)

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

  // Criar customer sem senha (para PDV)
  const customer = await customerRepository.createQuick(
    {
      name: validated.name,
      cpf: normalizedCpf,
      email: validated.email ?? null,
      phone: validated.phone ?? null
    },
    storeId
  )

  return {
    customer
  }
}

export { createQuickCustomerSchema }

