import { CouponRepository } from '../../../infra/db/repositories/coupon-repository'
import type { Coupon } from '../../../domain/coupons/coupon-types'

export interface ListCouponsDependencies {
  couponRepository: CouponRepository
}

export interface ListCouponsFilters {
  active?: boolean
}

export async function listCouponsUseCase(
  storeId: string,
  filters: ListCouponsFilters,
  dependencies: ListCouponsDependencies
): Promise<Coupon[]> {
  const { couponRepository } = dependencies

  let coupons = await couponRepository.listByStore(storeId)

  // Aplicar filtro de active se fornecido
  if (filters.active !== undefined) {
    coupons = coupons.filter((coupon) => coupon.active === filters.active)
  }

  return coupons
}

