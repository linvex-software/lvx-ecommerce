import { CouponRepository } from '../../../infra/db/repositories/coupon-repository'
import type {
  ValidateCouponInput,
  ValidateCouponResult
} from '../../../domain/coupons/coupon-types'

export interface ValidateCouponDependencies {
  couponRepository: CouponRepository
}

export async function validateCouponForCheckoutUseCase(
  input: ValidateCouponInput,
  dependencies: ValidateCouponDependencies
): Promise<ValidateCouponResult> {
  const { couponRepository } = dependencies

  // 1. Buscar cupom por storeId + code
  const coupon = await couponRepository.findByCode(input.storeId, input.code)

  if (!coupon) {
    return {
      valid: false,
      message: 'Cupom não encontrado.'
    }
  }

  // 2. Validar se está ativo
  if (!coupon.active) {
    return {
      valid: false,
      message: 'Cupom desativado.'
    }
  }

  // 3. Validar expiração
  if (coupon.expires_at && coupon.expires_at <= new Date()) {
    return {
      valid: false,
      message: 'Cupom expirado.'
    }
  }

  // 4. Validar limite de usos
  if (coupon.max_uses !== null && coupon.used_count >= coupon.max_uses) {
    return {
      valid: false,
      message: 'Cupom esgotado (limite de usos atingido).'
    }
  }

  // 5. Validar valor mínimo
  const minValue = coupon.min_value ? parseFloat(coupon.min_value) : null
  if (minValue !== null && input.orderTotal < minValue) {
    return {
      valid: false,
      message: `Valor mínimo do pedido não atingido. Mínimo: R$ ${(minValue / 100).toFixed(2)}`
    }
  }

  // 6. Calcular desconto
  const couponValue = parseFloat(coupon.value)
  let discount = 0

  if (coupon.type === 'percent') {
    discount = Math.floor(input.orderTotal * (couponValue / 100))
  } else {
    // fixed: desconto em centavos
    discount = Math.min(input.orderTotal, couponValue)
  }

  const finalPrice = input.orderTotal - discount

  // 7. Montar retorno
  return {
    valid: true,
    discountType: coupon.type,
    discountValue: discount,
    finalPrice,
    message: 'Cupom aplicado com sucesso.'
  }
}

