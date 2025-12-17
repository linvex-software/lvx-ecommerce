import { useState, useCallback } from 'react'
import { fetchAPI } from '../api'
import type { ShippingQuote } from '../types/shipping'

interface CalculateShippingInput {
  destination_zip_code: string
  items: Array<{
    quantity: number
    weight: number
    height: number
    width: number
    length: number
  }>
}

interface CalculateShippingResponse {
  quotes: ShippingQuote[]
}

export function useShipping() {
  const [quotes, setQuotes] = useState<ShippingQuote[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const calculateShipping = useCallback(
    async (input: CalculateShippingInput) => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetchAPI(
          '/shipping/calculate',
          {
            method: 'POST',
            body: JSON.stringify(input)
          }
        ) as CalculateShippingResponse

        setQuotes(response.quotes || [])
        return response.quotes
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Erro ao calcular frete. Tente novamente.'
        setError(errorMessage)
        setQuotes([])
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  const clearQuotes = useCallback(() => {
    setQuotes([])
    setError(null)
  }, [])

  return {
    quotes,
    isLoading,
    error,
    calculateShipping,
    clearQuotes
  }
}

