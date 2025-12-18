/**
 * Testes unitários para o algoritmo de recomendação de tamanho
 *
 * Este arquivo contém testes básicos para validar a lógica do algoritmo.
 * Em produção, estes testes devem ser executados com Vitest ou Jest.
 */

import { recommendSize, estimateMeasurements, type UserMeasurements, type ParsedSizeChart } from './algorithm'

// Teste 1: Estimativa de medidas básicas
export function testEstimateMeasurements() {
  const userData = {
    gender: 'feminino' as const,
    height: 165,
    weight: 65,
    age: 30
  }

  const result = estimateMeasurements(userData)

  console.assert(result.bust > 0, 'Busto deve ser maior que 0')
  console.assert(result.waist > 0, 'Cintura deve ser maior que 0')
  console.assert(result.hips > 0, 'Quadril deve ser maior que 0')

  return result
}

// Teste 2: Recomendação de tamanho simples
export function testRecommendSize() {
  const userMeasurements: UserMeasurements = {
    bust: 92,
    waist: 70,
    hips: 99
  }

  const sizeChart: ParsedSizeChart = {
    'P': {
      'Busto': '84 - 88',
      'Cintura': '66 - 70',
      'Quadril': '90 - 94'
    },
    'M': {
      'Busto': '92 - 96',
      'Cintura': '74 - 78',
      'Quadril': '102 - 106'
    },
    'G': {
      'Busto': '100 - 104',
      'Cintura': '82 - 86',
      'Quadril': '110 - 114'
    }
  }

  const result = recommendSize(userMeasurements, sizeChart)

  console.assert(result !== null, 'Deve retornar uma recomendação')
  console.assert(result?.size === 'M', 'Deve recomendar tamanho M')
  console.assert(result?.fitLevel !== undefined, 'Deve ter nível de ajuste')
  console.assert(result?.comparison.length > 0, 'Deve ter comparações')

  return result
}

// Teste 3: Caso sem medidas compatíveis
export function testNoCompatibleSize() {
  const userMeasurements: UserMeasurements = {
    bust: 50, // Medidas muito pequenas
    waist: 40,
    hips: 50
  }

  const sizeChart: ParsedSizeChart = {
    'G': {
      'Busto': '100 - 104',
      'Cintura': '82 - 86',
      'Quadril': '110 - 114'
    }
  }

  const result = recommendSize(userMeasurements, sizeChart)

  // Deve retornar null ou uma recomendação com ajuste aproximado
  console.assert(
    result === null || result?.fitLevel === 'aproximado',
    'Deve retornar null ou ajuste aproximado para medidas incompatíveis'
  )

  return result
}

// Executar testes (apenas em ambiente de desenvolvimento)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  try {
    testEstimateMeasurements()
    testRecommendSize()
    testNoCompatibleSize()
  } catch (error) {
    // Silenciar erros em produção
  }
}

