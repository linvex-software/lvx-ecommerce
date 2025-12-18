import { z } from 'zod'
import { PhysicalSalesCartRepository } from '../../../infra/db/repositories/physical-sales-cart-repository'
import { CouponRepository } from '../../../infra/db/repositories/coupon-repository'
import { validateCouponForCheckoutUseCase } from '../../coupons/use-cases/validate-coupon-for-checkout'
import type { PhysicalSalesCart } from '../../../domain/physical-sales/physical-sales-types'

const applyDiscountToPdvCartSchema = z.object({
  cart_id: z.string().uuid(),
  coupon_code: z.string().optional().nullable(),
  discount_amount: z.number().int().nonnegative().optional() // desconto manual em centavos
})

export interface ApplyDiscountToPdvCartDependencies {
  physicalSalesCartRepository: PhysicalSalesCartRepository
  couponRepository: CouponRepository
}

export async function applyDiscountToPdvCartUseCase(
  input: z.infer<typeof applyDiscountToPdvCartSchema>,
  storeId: string,
  sellerUserId: string,
  dependencies: ApplyDiscountToPdvCartDependencies
): Promise<PhysicalSalesCart> {
  const { physicalSalesCartRepository, couponRepository } = dependencies

  const validated = applyDiscountToPdvCartSchema.parse(input)

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

  let discountAmount = 0
  let couponCode: string | null = null

  // Se cupom fornecido, validar e calcular desconto
  if (validated.coupon_code) {
    const subtotal = cart.items.reduce((sum, item) => {
      const itemTotal = item.price * item.quantity
      const itemDiscount = item.discount ?? 0
      return sum + itemTotal - itemDiscount
    }, 0)

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

    discountAmount = couponValidation.discountValue ?? 0
    couponCode = validated.coupon_code
  } else if (validated.discount_amount !== undefined) {
    // Desconto manual
    const subtotal = cart.items.reduce((sum, item) => {
      const itemTotal = item.price * item.quantity
      const itemDiscount = item.discount ?? 0
      return sum + itemTotal - itemDiscount
    }, 0)

    discountAmount = Math.min(validated.discount_amount, subtotal)
  }

  // Atualizar carrinho
  const updatedCart = await physicalSalesCartRepository.update(validated.cart_id, storeId, {
    coupon_code: couponCode,
    discount_amount: discountAmount
  })

  return updatedCart
}

export { applyDiscountToPdvCartSchema }

