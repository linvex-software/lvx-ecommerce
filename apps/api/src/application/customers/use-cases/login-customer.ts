import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'
import { z } from 'zod'
import { CustomerRepository } from '../../../infra/db/repositories/customer-repository'
import { AuthSessionRepository } from '../../../infra/db/repositories/auth-session-repository'
import {
  normalizeCPF,
  validateCPF
} from '../../../domain/customers/customer-helpers'
import type {
  LoginCustomerInput,
  CustomerProfile
} from '../../../domain/customers/customer-types'

const loginCustomerSchema = z.object({
  cpf: z.string().refine(validateCPF, 'CPF inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres')
})

export interface LoginCustomerResult {
  accessToken: string
  refreshToken: string
  customer: CustomerProfile
}

export interface LoginCustomerDependencies {
  customerRepository: CustomerRepository
  authSessionRepository: AuthSessionRepository
  jwtSign: (payload: {
    sub: string
    storeId: string
    type: 'customer'
  }) => Promise<string>
}

export async function loginCustomerUseCase(
  input: LoginCustomerInput,
  storeId: string,
  dependencies: LoginCustomerDependencies
): Promise<LoginCustomerResult> {
  const { customerRepository, authSessionRepository, jwtSign } = dependencies

  // Validar input
  const validated = loginCustomerSchema.parse(input)

  // Normalizar CPF
  const normalizedCpf = normalizeCPF(validated.cpf)

  // Buscar customer por CPF + store_id
  const customer = await customerRepository.findByCpf(normalizedCpf, storeId)

  if (!customer) {
    throw new Error('Invalid credentials')
  }

  // Validar senha
  if (!customer.password_hash) {
    throw new Error('Invalid credentials')
  }

  const passwordMatch = await bcrypt.compare(
    validated.password,
    customer.password_hash
  )

  if (!passwordMatch) {
    throw new Error('Invalid credentials')
  }

  // Gerar JWT com payload de cliente
  const accessToken = await jwtSign({
    sub: customer.id,
    storeId: customer.store_id,
    type: 'customer'
  })

  // Gerar refresh token
  const refreshToken = randomUUID()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 30)

  // Criar sessão
  await authSessionRepository.createCustomerSession({
    customer_id: customer.id,
    store_id: customer.store_id,
    refresh_token: refreshToken,
    expires_at: expiresAt
  })

  return {
    accessToken,
    refreshToken,
    customer: {
      id: customer.id,
      store_id: customer.store_id,
      name: customer.name,
      email: customer.email,
      cpf: customer.cpf,
      phone: customer.phone,
      created_at: customer.created_at
    }
  }
}

export { loginCustomerSchema }

