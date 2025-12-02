import { CustomerAddressRepository } from '../../../infra/db/repositories/customer-address-repository'
import type { CustomerAddress } from '../../../domain/customers/customer-types'

export interface ListCustomerAddressesDependencies {
  customerAddressRepository: CustomerAddressRepository
}

export async function listCustomerAddressesUseCase(
  customerId: string,
  dependencies: ListCustomerAddressesDependencies
): Promise<CustomerAddress[]> {
  const { customerAddressRepository } = dependencies

  const addresses = await customerAddressRepository.findByCustomerId(customerId)

  return addresses
}

