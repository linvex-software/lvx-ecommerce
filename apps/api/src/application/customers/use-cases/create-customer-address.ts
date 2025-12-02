import { z } from 'zod'
import { CustomerAddressRepository } from '../../../infra/db/repositories/customer-address-repository'
import type {
  CustomerAddress,
  CreateCustomerAddressInput
} from '../../../domain/customers/customer-types'

const createCustomerAddressSchema = z.object({
  street: z.string().min(1, 'Rua é obrigatória'),
  city: z.string().min(1, 'Cidade é obrigatória'),
  state: z.string().length(2, 'Estado deve ter 2 caracteres (UF)'),
  zip: z.string().min(8, 'CEP deve ter pelo menos 8 caracteres').max(9, 'CEP inválido'),
  is_default: z.boolean().optional()
})

export interface CreateCustomerAddressDependencies {
  customerAddressRepository: CustomerAddressRepository
}

export interface CreateCustomerAddressResult {
  address: CustomerAddress
}

export async function createCustomerAddressUseCase(
  customerId: string,
  input: CreateCustomerAddressInput,
  dependencies: CreateCustomerAddressDependencies
): Promise<CreateCustomerAddressResult> {
  const { customerAddressRepository } = dependencies

  // Validar input
  const validated = createCustomerAddressSchema.parse(input)

  // Normalizar CEP (remover formatação)
  const normalizedZip = validated.zip.replace(/\D/g, '')

  // Criar endereço
  const address = await customerAddressRepository.create(customerId, {
    ...validated,
    zip: normalizedZip
  })

  return {
    address
  }
}

export { createCustomerAddressSchema }

