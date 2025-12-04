'use client'

import { useState, useEffect } from 'react'
import { useCartStore } from '@/lib/store/useCartStore'
import { Button } from '@/components/template/flor-de-menina/components/ui/button'
import { Loader2, MapPin, Package } from 'lucide-react'
import { fetchAPI } from '@/lib/api'
import { cn } from '@/lib/utils'

interface DeliveryOption {
  type: 'shipping' | 'pickup_point'
  id: string
  name: string
  price: number // em centavos
  description?: string
  delivery_time?: string
  address?: {
    street: string
    number: string
    complement?: string | null
    neighborhood: string
    city: string
    state: string
    zip_code: string
  }
}

interface DeliveryOptionsResponse {
  shippingOptions: DeliveryOption[]
  pickupOptions: DeliveryOption[]
}

interface DeliveryOptionsWithCepProps {
  zipCode: string
  onSelectionChange?: (option: DeliveryOption | null) => void
}

export function DeliveryOptionsWithCep({ zipCode, onSelectionChange }: DeliveryOptionsWithCepProps) {
  const { items } = useCartStore()
  const [options, setOptions] = useState<DeliveryOptionsResponse | null>(null)
  const [selectedOption, setSelectedOption] = useState<DeliveryOption | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDeliveryOptions = async () => {
    const cleanZipCode = zipCode.replace(/\D/g, '')
    if (cleanZipCode.length !== 8 || items.length === 0) {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const orderItems = items.map((item) => ({
        product_id: String(item.id),
        variant_id: item.variant_id ?? null,
        quantity: item.quantity,
        price: Math.round(item.price * 100), // converter para centavos
      }))

      const data: DeliveryOptionsResponse = await fetchAPI('/checkout/delivery-options', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          destination_zip_code: cleanZipCode,
          items: orderItems,
        }),
      })

      setOptions(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar opções de entrega')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Buscar opções quando CEP for preenchido e válido
    const cleanZipCode = zipCode.replace(/\D/g, '')
    if (cleanZipCode.length === 8 && items.length > 0) {
      fetchDeliveryOptions()
    } else {
      setOptions(null)
      setSelectedOption(null)
      onSelectionChange?.(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zipCode, items])

  const handleSelectOption = (option: DeliveryOption) => {
    setSelectedOption(option)
    onSelectionChange?.(option)
  }

  const formatPrice = (priceInCents: number): string => {
    if (priceInCents === 0) {
      return 'Grátis'
    }
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(priceInCents / 100)
  }

  const formatAddress = (address: DeliveryOption['address']): string => {
    if (!address) return ''
    const parts = [
      `${address.street}, ${address.number}`,
      address.complement,
      address.neighborhood,
      `${address.city} - ${address.state}`,
      address.zip_code,
    ].filter(Boolean)
    return parts.join(', ')
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="ml-2 text-sm text-muted-foreground">Buscando opções de entrega...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={fetchDeliveryOptions}>
            Tentar novamente
          </Button>
        </div>
      </div>
    )
  }

  if (!options) {
    return null
  }

  const hasOptions = options.shippingOptions.length > 0 || options.pickupOptions.length > 0

  if (!hasOptions) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Nenhuma opção de entrega disponível para este CEP.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Opções de Frete */}
      {options.shippingOptions.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Frete</h4>
          <div className="space-y-2">
            {options.shippingOptions.map((option) => (
              <button
                key={`shipping-${option.id}`}
                type="button"
                onClick={() => handleSelectOption(option)}
                className={cn(
                  'w-full text-left p-4 border rounded-lg transition-colors',
                  selectedOption?.type === 'shipping' && selectedOption?.id === option.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3 flex-1">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{option.name}</span>
                        {option.description && (
                          <span className="text-xs text-muted-foreground">{option.description}</span>
                        )}
                      </div>
                      {option.delivery_time && (
                        <p className="text-xs text-muted-foreground">{option.delivery_time}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm">{formatPrice(option.price)}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Opções de Retirada */}
      {options.pickupOptions.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Retirada na Loja</h4>
          <div className="space-y-2">
            {options.pickupOptions.map((option) => (
              <button
                key={`pickup-${option.id}`}
                type="button"
                onClick={() => handleSelectOption(option)}
                className={cn(
                  'w-full text-left p-4 border rounded-lg transition-colors',
                  selectedOption?.type === 'pickup_point' && selectedOption?.id === option.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3 flex-1">
                    <Package className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{option.name}</span>
                        {option.description && (
                          <span className="text-xs text-muted-foreground">{option.description}</span>
                        )}
                      </div>
                      {option.address && (
                        <p className="text-xs text-muted-foreground">{formatAddress(option.address)}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm">{formatPrice(option.price)}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {!selectedOption && (
        <p className="text-sm text-destructive">Selecione uma opção de entrega para continuar.</p>
      )}
    </div>
  )
}


