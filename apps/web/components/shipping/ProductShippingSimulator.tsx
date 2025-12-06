'use client'

import { useState, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Loader2, MapPin, Truck, Calculator } from 'lucide-react'
import { useShipping } from '@/lib/hooks/use-shipping'
import type { ShippingQuote } from '@/lib/types/shipping'

interface ProductShippingSimulatorProps {
  productId: string
  quantity?: number
  weight?: number // em kg
  height?: number // em cm
  width?: number // em cm
  length?: number // em cm
}

// Valores padrão para dimensões e peso (em cm e kg)
const DEFAULT_DIMENSIONS = {
  height: 4,
  width: 12,
  length: 17,
  weight: 0.3
}

export function ProductShippingSimulator({
  productId,
  quantity = 1,
  weight = DEFAULT_DIMENSIONS.weight,
  height = DEFAULT_DIMENSIONS.height,
  width = DEFAULT_DIMENSIONS.width,
  length = DEFAULT_DIMENSIONS.length
}: ProductShippingSimulatorProps) {
  const { quotes, isLoading, error, calculateShipping } = useShipping()
  const [zipCode, setZipCode] = useState('')
  const [selectedQuote, setSelectedQuote] = useState<ShippingQuote | null>(null)

  const handleZipCodeChange = useCallback((value: string) => {
    // Remove caracteres não numéricos
    const cleanValue = value.replace(/\D/g, '')
    
    // Limita a 8 dígitos
    const limitedValue = cleanValue.slice(0, 8)
    
    // Formata com hífen (12345-678)
    let formattedValue = limitedValue
    if (limitedValue.length > 5) {
      formattedValue = `${limitedValue.slice(0, 5)}-${limitedValue.slice(5)}`
    }
    
    setZipCode(formattedValue)
  }, [])

  const handleCalculate = useCallback(() => {
    const cleanZipCode = zipCode.replace(/\D/g, '')
    
    if (cleanZipCode.length !== 8) {
      return
    }

    calculateShipping({
      destination_zip_code: cleanZipCode,
      items: [
        {
          quantity,
          weight,
          height,
          width,
          length
        }
      ]
    }).catch(() => {
      // Erro já é tratado no hook
    })
  }, [zipCode, quantity, weight, height, width, length, calculateShipping])

  const isZipCodeValid = zipCode.replace(/\D/g, '').length === 8

  const handleQuoteSelect = useCallback((quote: ShippingQuote) => {
    setSelectedQuote(quote)
  }, [])

  const formatPrice = (price: string): string => {
    const numPrice = parseFloat(price)
    return isNaN(numPrice) ? '0.00' : numPrice.toFixed(2)
  }

  const formatDeliveryTime = (quote: ShippingQuote): string => {
    // Tenta usar delivery_range primeiro
    if (quote.delivery_range?.min !== undefined && quote.delivery_range?.max !== undefined) {
      const min = quote.delivery_range.min
      const max = quote.delivery_range.max
      if (min === max) {
        return `${min} ${min === 1 ? 'dia útil' : 'dias úteis'}`
      }
      return `${min} a ${max} dias úteis`
    }
    
    // Fallback para custom_delivery_range
    if (quote.custom_delivery_range?.min !== undefined && quote.custom_delivery_range?.max !== undefined) {
      const min = quote.custom_delivery_range.min
      const max = quote.custom_delivery_range.max
      if (min === max) {
        return `${min} ${min === 1 ? 'dia útil' : 'dias úteis'}`
      }
      return `${min} a ${max} dias úteis`
    }
    
    // Fallback para delivery_time ou custom_delivery_time
    const deliveryTime = quote.custom_delivery_time || quote.delivery_time
    if (deliveryTime !== undefined) {
      return `${deliveryTime} ${deliveryTime === 1 ? 'dia útil' : 'dias úteis'}`
    }
    
    // Último fallback
    return 'Prazo a consultar'
  }

  return (
    <div className="border border-border rounded-lg p-4 bg-card space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Truck className="h-5 w-5 text-muted-foreground" />
        <h3 className="font-semibold text-lg">Calcular Frete</h3>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`zip-code-${productId}`} className="text-sm font-medium">
          CEP de destino
        </Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id={`zip-code-${productId}`}
              type="text"
              placeholder="00000-000"
              value={zipCode}
              onChange={(e) => handleZipCodeChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && isZipCodeValid) {
                  handleCalculate()
                }
              }}
              maxLength={9}
              className="pl-9"
              disabled={isLoading}
            />
          </div>
          <Button
            onClick={handleCalculate}
            disabled={!isZipCodeValid || isLoading}
            className="shrink-0"
            size="default"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Calculando...
              </>
            ) : (
              <>
                <Calculator className="h-4 w-4 mr-2" />
                Calcular
              </>
            )}
          </Button>
        </div>
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </div>

      {quotes.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Opções de Frete</p>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {quotes.map((quote) => (
              <button
                key={quote.id}
                type="button"
                onClick={() => handleQuoteSelect(quote)}
                className={`w-full text-left p-3 border rounded-lg transition-colors ${
                  selectedQuote?.id === quote.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {quote.company?.picture && (
                        <img
                          src={quote.company.picture}
                          alt={quote.company?.name || quote.name}
                          className="w-5 h-5 object-contain"
                        />
                      )}
                      <span className="font-medium text-sm">{quote.name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDeliveryTime(quote)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm">
                      R$ {formatPrice(quote.custom_price || quote.price || '0.00')}
                    </p>
                    {quote.discount && parseFloat(quote.discount || '0') > 0 && (
                      <p className="text-xs text-muted-foreground line-through">
                        R$ {formatPrice(quote.price || '0.00')}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedQuote && (
        <div className="pt-2 border-t border-border">
          <p className="text-sm text-muted-foreground">
            Frete selecionado: <span className="font-semibold text-foreground">{selectedQuote.name}</span>
          </p>
          <p className="text-xs text-muted-foreground">
            {formatDeliveryTime(selectedQuote)} • R$ {formatPrice(selectedQuote.custom_price || selectedQuote.price || '0.00')}
          </p>
        </div>
      )}
    </div>
  )
}

