import { useState } from 'react'
import { fetchAPI } from '@/lib/api'

interface ValidateCouponParams {
  code: string
  orderTotal: number // em centavos
}

interface ValidateCouponResult {
  valid: boolean
  discountType?: 'percent' | 'fixed'
  discountValue?: number // valor do desconto em centavos
  finalPrice?: number // total com desconto aplicado em centavos
  message: string
}

export function useValidateCoupon() {
  const [isValidating, setIsValidating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const validateCoupon = async (params: ValidateCouponParams): Promise<ValidateCouponResult | null> => {
    setIsValidating(true)
    setError(null)

    try {
      const response = await fetchAPI('/checkout/validate-coupon', {
        method: 'POST',
        body: JSON.stringify({
          code: params.code.toUpperCase().trim(),
          orderTotal: params.orderTotal,
        }),
      })

      return response as ValidateCouponResult
    } catch (err: any) {
      const errorMessage = err.payload?.error || err.message || 'Erro ao validar cupom'
      setError(errorMessage)
      return null
    } finally {
      setIsValidating(false)
    }
  }

  return {
    validateCoupon,
    isValidating,
    error,
  }
}

