import { z } from 'zod'
import { PhysicalSalesCartRepository } from '../../../infra/db/repositories/physical-sales-cart-repository'
import { CustomerRepository } from '../../../infra/db/repositories/customer-repository'
import type { PhysicalSalesCart } from '../../../domain/physical-sales/physical-sales-types'

const associateCustomerToPdvCartSchema = z.object({
  cart_id: z.string().uuid(),
  customer_id: z.string().uuid().optional().nullable()
})

export interface AssociateCustomerToPdvCartDependencies {
  physicalSalesCartRepository: PhysicalSalesCartRepository
  customerRepository: CustomerRepository
}

export async function associateCustomerToPdvCartUseCase(
  input: z.infer<typeof associateCustomerToPdvCartSchema>,
  storeId: string,
  sellerUserId: string,
  dependencies: AssociateCustomerToPdvCartDependencies
): Promise<PhysicalSalesCart> {
  const { physicalSalesCartRepository, customerRepository } = dependencies

  const validated = associateCustomerToPdvCartSchema.parse(input)

  // Buscar carrinho
  const cart = await physicalSalesCartRepository.findById(validated.cart_id, storeId)
  if (!cart) {
    throw new Error('Cart not found')
  }

  if (cart.seller_user_id !== sellerUserId) {
    throw new Error('Cart does not belong to seller')
  }

  if (cart.status !== 'active') {
    throw new Error('Cart is not active')
  }

  // Se customer_id fornecido, validar que existe
  if (validated.customer_id) {
    const customer = await customerRepository.findById(validated.customer_id, storeId)
    if (!customer) {
      throw new Error('Customer not found')
    }
  }

  // Atualizar carrinho
  const updatedCart = await physicalSalesCartRepository.update(validated.cart_id, storeId, {
    customer_id: validated.customer_id ?? null
  })

  return updatedCart
}

export { associateCustomerToPdvCartSchema }

