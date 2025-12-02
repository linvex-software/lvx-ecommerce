import { CustomerAddressRepository } from '../../../infra/db/repositories/customer-address-repository'
import type { CustomerAddress } from '../../../domain/customers/customer-types'

export interface SetDefaultCustomerAddressDependencies {
  customerAddressRepository: CustomerAddressRepository
}

export async function setDefaultCustomerAddressUseCase(
  addressId: string,
  customerId: string,
  dependencies: SetDefaultCustomerAddressDependencies
): Promise<CustomerAddress> {
  const { customerAddressRepository } = dependencies

  // Verificar se endereço existe e pertence ao cliente
  const existingAddress = await customerAddressRepository.findById(addressId, customerId)
  if (!existingAddress) {
    throw new Error('Address not found')
  }

  // Definir como padrão (já desmarca outros automaticamente)
  const address = await customerAddressRepository.setDefault(addressId, customerId)

  return address
}

