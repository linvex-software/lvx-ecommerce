import { CouponRepository } from '../../../infra/db/repositories/coupon-repository'

export interface DeleteCouponDependencies {
  couponRepository: CouponRepository
}

export async function deleteCouponUseCase(
  couponId: string,
  storeId: string,
  dependencies: DeleteCouponDependencies
): Promise<void> {
  const { couponRepository } = dependencies

  // Verificar que cupom existe e pertence ao storeId
  const coupon = await couponRepository.findById(couponId, storeId)
  if (!coupon) {
    throw new Error('Coupon not found')
  }

  // Soft delete (isActive = false)
  await couponRepository.softDelete(couponId, storeId)
}

