import { CustomerAddressRepository } from '../../../infra/db/repositories/customer-address-repository'

export interface DeleteCustomerAddressDependencies {
  customerAddressRepository: CustomerAddressRepository
}

export async function deleteCustomerAddressUseCase(
  addressId: string,
  customerId: string,
  dependencies: DeleteCustomerAddressDependencies
): Promise<void> {
  const { customerAddressRepository } = dependencies

  // Verificar se endereço existe e pertence ao cliente
  const existingAddress = await customerAddressRepository.findById(addressId, customerId)
  if (!existingAddress) {
    throw new Error('Address not found')
  }

  // Deletar endereço
  await customerAddressRepository.delete(addressId, customerId)
}

