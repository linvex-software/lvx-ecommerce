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
      <div className="border-2 border-green-500/50 bg-gradient-to-r from-green-50 to-green-100/50 dark:from-green-900/30 dark:to-green-800/20 rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-500/20 dark:bg-green-500/30">
              <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-green-900 dark:text-green-100">
                Cupom aplicado!
              </p>
              <p className="text-xs text-green-700 dark:text-green-300 mt-0.5">
                Código: <span className="font-mono font-bold">{appliedCoupon}</span>
              </p>
            </div>
          </div>
          <button
            onClick={handleRemoveCoupon}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 dark:text-green-300 hover:text-green-900 dark:hover:text-green-100 hover:bg-green-200/50 dark:hover:bg-green-800/30 rounded-md transition-colors"
          >
            <X className="h-3.5 w-3.5" />
            Remover
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <Tag className="h-4 w-4 text-muted-foreground" />
        <label className="text-sm font-medium text-foreground">Cupom de Desconto</label>
      </div>
      
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
            placeholder="Digite o código do cupom"
            className="w-full px-4 py-3 pr-10 border-2 border-border bg-background font-body focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm uppercase transition-all"
            disabled={isValidating}
          />
          <Tag className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        </div>
        <Button
          onClick={handleApplyCoupon}
          disabled={isValidating || !couponCode.trim()}
          size="default"
          className="px-6 font-medium"
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
          className={`flex items-start gap-2.5 text-sm p-3 rounded-lg border ${
            validationResult.valid
              ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800'
          }`}
        >
          {validationResult.valid ? (
            <Check className="h-4 w-4 flex-shrink-0 mt-0.5" />
          ) : (
            <X className="h-4 w-4 flex-shrink-0 mt-0.5" />
          )}
          <span className="font-medium">{validationResult.message}</span>
        </div>
      )}
    </div>
  )
}

