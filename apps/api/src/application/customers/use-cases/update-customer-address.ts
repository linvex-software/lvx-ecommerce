import { z } from 'zod'
import { CustomerAddressRepository } from '../../../infra/db/repositories/customer-address-repository'
import type {
  CustomerAddress,
  UpdateCustomerAddressInput
} from '../../../domain/customers/customer-types'

const updateCustomerAddressSchema = z.object({
  street: z.string().min(1, 'Rua é obrigatória').optional(),
  city: z.string().min(1, 'Cidade é obrigatória').optional(),
  state: z.string().length(2, 'Estado deve ter 2 caracteres (UF)').optional(),
  zip: z.string().min(8, 'CEP deve ter pelo menos 8 caracteres').max(9, 'CEP inválido').optional(),
  is_default: z.boolean().optional()
})

export interface UpdateCustomerAddressDependencies {
  customerAddressRepository: CustomerAddressRepository
}

export async function updateCustomerAddressUseCase(
  addressId: string,
  customerId: string,
  input: UpdateCustomerAddressInput,
  dependencies: UpdateCustomerAddressDependencies
): Promise<CustomerAddress> {
  const { customerAddressRepository } = dependencies

  // Validar input
  const validated = updateCustomerAddressSchema.parse(input)

  // Normalizar CEP se fornecido
  const updateData = { ...validated }
  if (validated.zip) {
    updateData.zip = validated.zip.replace(/\D/g, '')
  }

  // Verificar se endereço existe e pertence ao cliente
  const existingAddress = await customerAddressRepository.findById(addressId, customerId)
  if (!existingAddress) {
    throw new Error('Address not found')
  }

  // Atualizar endereço
  const address = await customerAddressRepository.update(addressId, customerId, updateData)

  return address
}

export { updateCustomerAddressSchema }

