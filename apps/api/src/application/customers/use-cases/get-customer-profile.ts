import { CustomerRepository } from '../../../infra/db/repositories/customer-repository'
import type { CustomerProfile } from '../../../domain/customers/customer-types'

export interface GetCustomerProfileDependencies {
  customerRepository: CustomerRepository
}

export async function getCustomerProfileUseCase(
  customerId: string,
  storeId: string,
  dependencies: GetCustomerProfileDependencies
): Promise<CustomerProfile> {
  const { customerRepository } = dependencies

  const customer = await customerRepository.findById(customerId, storeId)

  if (!customer) {
    throw new Error('Customer not found')
  }

  return {
    id: customer.id,
    store_id: customer.store_id,
    name: customer.name,
    email: customer.email,
    cpf: customer.cpf,
    phone: customer.phone,
    created_at: customer.created_at
  }
}

