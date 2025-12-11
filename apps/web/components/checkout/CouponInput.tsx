'use client'

import { useState } from 'react'
import { Button } from '@/components/template/flor-de-menina/components/ui/button'
import { useValidateCoupon } from '@/lib/hooks/use-validate-coupon'
import { Check, X, Tag, Loader2 } from 'lucide-react'

interface CouponInputProps {
  subtotal: number // em reais
  onCouponApplied: (couponData: {
    code: string
    discountValue: number // em reais
    finalPrice: number // em reais
  }) => void
  onCouponRemoved: () => void
  appliedCoupon: string | null
}

export function CouponInput({ subtotal, onCouponApplied, onCouponRemoved, appliedCoupon }: CouponInputProps) {
  const [couponCode, setCouponCode] = useState('')
  const [validationResult, setValidationResult] = useState<{
    valid: boolean
    message: string
  } | null>(null)
  const { validateCoupon, isValidating, error } = useValidateCoupon()

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setValidationResult({
        valid: false,
        message: 'Digite um código de cupom',
      })
      return
    }

    // Converter subtotal para centavos
    const subtotalCents = Math.round(subtotal * 100)

    const result = await validateCoupon({
      code: couponCode,
      orderTotal: subtotalCents,
    })

    if (result) {
      setValidationResult({
        valid: result.valid,
        message: result.message,
      })

      if (result.valid && result.discountValue && result.finalPrice) {
        // Converter de centavos para reais
        const discountReais = result.discountValue / 100
        const finalPriceReais = result.finalPrice / 100

        onCouponApplied({
          code: couponCode.toUpperCase().trim(),
          discountValue: discountReais,
          finalPrice: finalPriceReais,
        })
      }
    } else if (error) {
      setValidationResult({
        valid: false,
        message: error,
      })
    }
  }

  const handleRemoveCoupon = () => {
    setCouponCode('')
    setValidationResult(null)
    onCouponRemoved()
  }

  // Se já tem cupom aplicado, mostrar resumo
  if (appliedCoupon) {
    return (
      <div className="border border-green-500 bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
            <span className="text-sm font-medium text-green-800 dark:text-green-200">
              Cupom <strong>{appliedCoupon}</strong> aplicado!
            </span>
          </div>
          <button
            onClick={handleRemoveCoupon}
            className="text-sm text-green-700 dark:text-green-300 hover:text-green-900 dark:hover:text-green-100 transition-colors"
          >
            Remover
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={couponCode}
            onChange={(e) => {
              setCouponCode(e.target.value.toUpperCase())
              setValidationResult(null) // Limpar validação ao digitar
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleApplyCoupon()
              }
            }}
            placeholder="Digite o cupom"
            className="w-full px-4 py-2 border border-border bg-background font-body focus:outline-none focus:ring-1 focus:ring-primary text-sm uppercase"
            disabled={isValidating}
          />
          <Tag className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        </div>
        <Button
          onClick={handleApplyCoupon}
          disabled={isValidating || !couponCode.trim()}
          size="sm"
          className="px-4"
        >
          {isValidating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Validando...
            </>
          ) : (
            'Aplicar'
          )}
        </Button>
      </div>

      {/* Feedback de validação */}
      {validationResult && (
        <div
          className={`flex items-start gap-2 text-sm p-2 rounded ${
            validationResult.valid
              ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200'
              : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
          }`}
        >
          {validationResult.valid ? (
            <Check className="h-4 w-4 flex-shrink-0 mt-0.5" />
          ) : (
            <X className="h-4 w-4 flex-shrink-0 mt-0.5" />
          )}
          <span>{validationResult.message}</span>
        </div>
      )}
    </div>
  )
}

