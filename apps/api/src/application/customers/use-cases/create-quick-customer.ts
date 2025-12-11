import { z } from 'zod'
import { CustomerRepository } from '../../../infra/db/repositories/customer-repository'
import {
  normalizeCPF,
  validateCPF
} from '../../../domain/customers/customer-helpers'
import type { Customer } from '../../../domain/customers/customer-types'

const createQuickCustomerSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  cpf: z
    .string()
    .optional()
    .nullable()
    .refine(
      (val) => !val || validateCPF(val),
      'CPF inválido'
    ),
  email: z
    .union([z.string().email('Email inválido'), z.literal(''), z.null()])
    .optional()
    .nullable()
    .transform((val) => (val && val.trim() ? val.trim() : null)),
  phone: z
    .string()
    .optional()
    .nullable()
    .refine(
      (val) => !val || /^[\d\s()+-]+$/.test(val),
      'Telefone inválido'
    )
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

  // Normalizar CPF (se fornecido)
  let normalizedCpf: string | null = null
  if (validated.cpf && validated.cpf.trim()) {
    normalizedCpf = normalizeCPF(validated.cpf)
    
    // Verificar se CPF já existe na loja
    const existingByCpf = await customerRepository.findByCpf(normalizedCpf, storeId)
    if (existingByCpf) {
      throw new Error('CPF já cadastrado nesta loja')
    }
  }

  // Verificar se email já existe na loja (se fornecido e não vazio)
  const emailToCheck = validated.email?.trim() || null
  if (emailToCheck) {
    const existingByEmail = await customerRepository.findByEmail(
      emailToCheck,
      storeId
    )
    if (existingByEmail) {
      throw new Error('Email já cadastrado nesta loja')
    }
  }

  // Normalizar telefone (remover formatação se fornecido)
  let normalizedPhone: string | null = null
  if (validated.phone && validated.phone.trim()) {
    normalizedPhone = validated.phone.replace(/\D/g, '')
  }

  // Criar customer sem senha (para PDV)
  const customer = await customerRepository.createQuick(
    {
      name: validated.name.trim(),
      cpf: normalizedCpf,
      email: emailToCheck,
      phone: normalizedPhone
    },
    storeId
  )

  return {
    customer
  }
}

export { createQuickCustomerSchema }

