import { z } from 'zod'
import { PhysicalSalesCartRepository } from '../../../infra/db/repositories/physical-sales-cart-repository'
import { ProductRepository } from '../../../infra/db/repositories/product-repository'
import { CouponRepository } from '../../../infra/db/repositories/coupon-repository'
import { validateCouponForCheckoutUseCase } from '../../coupons/use-cases/validate-coupon-for-checkout'
import type { PhysicalSalesCart } from '../../../domain/physical-sales/physical-sales-types'

const createPhysicalSalesCartSchema = z.object({
  items: z.array(
    z.object({
      product_id: z.string().uuid(),
      variant_id: z.string().uuid().optional().nullable(),
      quantity: z.number().int().positive(),
      price: z.number().int().nonnegative()
    })
  ),
  coupon_code: z.string().optional().nullable(),
  shipping_address: z.string().optional().nullable()
})

export interface CreatePhysicalSalesCartDependencies {
  physicalSalesCartRepository: PhysicalSalesCartRepository
  productRepository: ProductRepository
  couponRepository: CouponRepository
}

export async function createPhysicalSalesCartUseCase(
  input: z.infer<typeof createPhysicalSalesCartSchema>,
  storeId: string,
  sellerUserId: string,
  dependencies: CreatePhysicalSalesCartDependencies
): Promise<PhysicalSalesCart> {
  const { physicalSalesCartRepository, productRepository, couponRepository } = dependencies

  const validated = createPhysicalSalesCartSchema.parse(input)

  // Validar que há pelo menos um item
  if (validated.items.length === 0) {
    throw new Error('Cart must have at least one item')
  }

  // Validar produtos existem e pertencem à loja
  for (const item of validated.items) {
    const product = await productRepository.findById(item.product_id, storeId)
    if (!product) {
      throw new Error(`Product ${item.product_id} not found`)
    }
  }

  // Calcular total
  const subtotal = validated.items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  // Validar cupom se fornecido
  if (validated.coupon_code) {
    const couponValidation = await validateCouponForCheckoutUseCase(
      {
        storeId,
        code: validated.coupon_code,
        orderTotal: subtotal
      },
      { couponRepository }
    )

    if (!couponValidation.valid) {
      throw new Error(couponValidation.message)
    }
  }

  // Criar carrinho
  const cart = await physicalSalesCartRepository.create(
    {
      items: validated.items,
      coupon_code: validated.coupon_code ?? null,
      shipping_address: validated.shipping_address ?? null
    },
    storeId,
    sellerUserId
  )

  return cart
}

export { createPhysicalSalesCartSchema }

