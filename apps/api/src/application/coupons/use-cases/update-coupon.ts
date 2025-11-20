import { z } from 'zod'
import { CouponRepository } from '../../../infra/db/repositories/coupon-repository'
import type { Coupon, UpdateCouponInput } from '../../../domain/coupons/coupon-types'

const updateCouponSchema = z.object({
  code: z.string().min(1).max(50).optional(),
  type: z.enum(['percent', 'fixed']).optional(),
  value: z.number().positive().optional(),
  min_value: z.number().positive().optional().nullable(),
  max_uses: z.number().int().positive().optional().nullable(),
  expires_at: z.date().optional().nullable(),
  active: z.boolean().optional()
})

export interface UpdateCouponDependencies {
  couponRepository: CouponRepository
}

export async function updateCouponUseCase(
  couponId: string,
  storeId: string,
  input: z.infer<typeof updateCouponSchema>,
  dependencies: UpdateCouponDependencies
): Promise<Coupon> {
  const { couponRepository } = dependencies

  // Validar payload
  const validated = updateCouponSchema.parse(input)

  // Verificar que cupom pertence ao storeId
  const existingCoupon = await couponRepository.findById(couponId, storeId)
  if (!existingCoupon) {
    throw new Error('Coupon not found')
  }

  // Se está mudando o código, verificar unicidade
  if (validated.code && validated.code !== existingCoupon.code) {
    const codeExists = await couponRepository.findByCode(storeId, validated.code)
    if (codeExists && codeExists.id !== couponId) {
      throw new Error('Coupon code already exists for this store')
    }
  }

  // Validar value baseado no type
  if (validated.type === 'percent' && validated.value !== undefined && validated.value > 100) {
    throw new Error('Percentage value cannot exceed 100')
  }

  const updateInput: UpdateCouponInput = {
    code: validated.code,
    type: validated.type,
    value: validated.value,
    min_value: validated.min_value,
    max_uses: validated.max_uses,
    expires_at: validated.expires_at,
    active: validated.active
  }

  return await couponRepository.update(couponId, storeId, updateInput)
}

export { updateCouponSchema }

