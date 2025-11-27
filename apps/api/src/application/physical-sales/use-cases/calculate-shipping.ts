import type {
  ShippingCalculationInput,
  ShippingCalculationResult
} from '../../../domain/physical-sales/physical-sales-types'
import { db, schema } from '@white-label/db'
import { eq, and, gte } from 'drizzle-orm'

export interface CalculateShippingDependencies {
  // Pode ser expandido no futuro para incluir serviços de frete reais
}

/**
 * Calcula o frete para uma venda física.
 *
 * Esta é uma implementação stub que pode ser expandida no futuro.
 * Por enquanto, usa uma lógica simples baseada em CEP e peso.
 *
 * TODO: Integrar com serviços reais de frete (Correios, Melhor Envio, etc)
 */
export async function calculateShippingUseCase(
  input: ShippingCalculationInput,
  storeId: string,
  dependencies: CalculateShippingDependencies
): Promise<ShippingCalculationResult> {
  // Verificar cache de frete primeiro
  const cachedShipping = await checkShippingCache(storeId, input.zip_code, input.weight ?? 1)

  if (cachedShipping) {
    return {
      cost: Math.round(parseFloat(cachedShipping.price)),
      estimated_days: null,
      provider: 'cached'
    }
  }

  // Stub: cálculo simples baseado em CEP e peso
  // Regra básica: CEPs que começam com 0-4 (regiões mais próximas) = frete menor
  const zipCodePrefix = parseInt(input.zip_code.substring(0, 1))
  const weight = input.weight ?? 1 // kg

  let baseCost = 1000 // R$ 10,00 em centavos (base)

  // Ajustar por região (simplificado)
  if (zipCodePrefix >= 0 && zipCodePrefix <= 4) {
    baseCost = 800 // Regiões próximas: R$ 8,00
  } else if (zipCodePrefix >= 5 && zipCodePrefix <= 7) {
    baseCost = 1200 // Regiões médias: R$ 12,00
  } else {
    baseCost = 1500 // Regiões distantes: R$ 15,00
  }

  // Adicionar custo por peso (R$ 2,00 por kg adicional)
  const weightCost = Math.max(0, (weight - 1) * 200)
  const totalCost = baseCost + weightCost

  // Estimar dias (simplificado)
  let estimatedDays: number | null = null
  if (zipCodePrefix >= 0 && zipCodePrefix <= 4) {
    estimatedDays = 3 // Regiões próximas: 3 dias
  } else if (zipCodePrefix >= 5 && zipCodePrefix <= 7) {
    estimatedDays = 5 // Regiões médias: 5 dias
  } else {
    estimatedDays = 7 // Regiões distantes: 7 dias
  }

  // Salvar no cache (opcional, pode ser implementado depois)
  // await saveShippingCache(storeId, input.zip_code, weight, totalCost)

  return {
    cost: totalCost,
    estimated_days: estimatedDays,
    provider: 'stub'
  }
}

async function checkShippingCache(
  storeId: string,
  zipCode: string,
  weight: number
): Promise<{ price: string } | null> {
  try {
    const result = await db
      .select()
      .from(schema.shippingCache)
      .where(
        and(
          eq(schema.shippingCache.store_id, storeId),
          eq(schema.shippingCache.dest_zip, zipCode),
          gte(schema.shippingCache.expires_at, new Date())
        )
      )
      .limit(1)

    if (result.length > 0) {
      const cached = result[0]
      // Verificar se o peso é similar (dentro de 10% de diferença)
      const cachedWeight = parseFloat(cached.weight)
      if (Math.abs(cachedWeight - weight) / cachedWeight <= 0.1) {
        return { price: cached.price }
      }
    }
  } catch (error) {
    // Se houver erro ao buscar cache, continuar com cálculo
    console.error('Error checking shipping cache:', error)
  }

  return null
}

