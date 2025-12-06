import { z } from 'zod'
import { CouponRepository } from '../../../infra/db/repositories/coupon-repository'
import type { Coupon, CreateCouponInput } from '../../../domain/coupons/coupon-types'

const createCouponSchema = z.object({
  code: z.string().min(1).max(50),
  type: z.enum(['percent', 'fixed']),
  value: z.number().positive(),
  min_value: z.number().positive().optional().nullable(),
  max_uses: z.number().int().positive().optional().nullable(),
  expires_at: z.date().optional().nullable()
})

export interface CreateCouponDependencies {
  couponRepository: CouponRepository
}

export async function createCouponUseCase(
  input: z.infer<typeof createCouponSchema>,
  storeId: string,
  dependencies: CreateCouponDependencies
): Promise<Coupon> {
  const { couponRepository } = dependencies

  // Validar payload
  const validated = createCouponSchema.parse(input)

  // Verificar unicidade do código
  const existingCoupon = await couponRepository.findByCode(storeId, validated.code)
  if (existingCoupon) {
    throw new Error('Coupon code already exists for this store')
  }

  // Validar value baseado no type
  if (validated.type === 'percent' && validated.value > 100) {
    throw new Error('Percentage value cannot exceed 100')
  }

  const createInput: CreateCouponInput = {
    store_id: storeId,
    code: validated.code,
    type: validated.type,
    value: validated.value,
    min_value: validated.min_value ?? null,
    max_uses: validated.max_uses ?? null,
    expires_at: validated.expires_at ?? null
  }

  return await couponRepository.create(createInput)
}

export { createCouponSchema }

