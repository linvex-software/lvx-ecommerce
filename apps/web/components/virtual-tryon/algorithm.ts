/**
 * Algoritmo de recomendação de tamanho baseado em medidas
 *
 * Este algoritmo calcula o tamanho recomendado comparando as medidas do usuário
 * com a tabela de medidas do produto (size_chart).
 *
 * IDEIA DO ALGORITMO:
 * 1. Para cada tamanho disponível no produto, calcula um "score" de proximidade
 * 2. O score é a soma das diferenças (em cm) entre as medidas do usuário e o centro do range de cada medida do produto
 * 3. O tamanho com menor score (menor diferença total) é o recomendado
 * 4. Se dois tamanhos estiverem muito próximos, prioriza o menor (mais justo)
 *
 * LIMITAÇÕES:
 * - Este é um algoritmo básico frontend, calculado apenas no browser
 * - Não considera fatores como tipo de tecido, modelo do produto, preferências pessoais
 * - Não usa IA ou machine learning
 * - Será substituído/expandido futuramente via backend com algoritmo mais sofisticado
 * - Não persiste dados no servidor (apenas localStorage)
 */

export interface UserMeasurements {
  bust: number // Busto em cm
  waist: number // Cintura em cm
  hips: number // Quadril em cm
}

export interface UserBasicData {
  gender: 'feminino' | 'masculino'
  height: number // Altura em cm
  weight: number // Peso em kg
  age: number // Idade em anos
}

export type FitLevel = 'excelente' | 'bom' | 'aproximado'

export interface SizeRecommendation {
  size: string
  fitLevel: FitLevel // Substitui "confidence" por "fitLevel" (nível de ajuste)
  score: number
  comparison: Array<{
    measurement: string
    userValue: number
    productRange: string
    productCenter: number
    difference: number
    status: 'ok' | 'justo' | 'folgado'
  }>
  alternativeSize?: string // Tamanho alternativo se houver empate próximo
}

export interface ParsedSizeChart {
  [size: string]: {
    [measurement: string]: string // Ex: "92 - 96" ou "92"
  }
}

/**
 * Estima medidas corporais básicas baseado em altura, peso, sexo e idade
 * Usa regras antropométricas simplificadas
 */
export function estimateMeasurements(data: UserBasicData): UserMeasurements {
  const { height, weight, gender, age } = data

  // Fórmulas básicas baseadas em proporções corporais médias
  // Ajustadas para brasileiros (dados aproximados)

  let bust: number
  let waist: number
  let hips: number

  if (gender === 'feminino') {
    // Proporções médias para mulheres
    bust = height * 0.52 + (weight * 0.15) // Altura influencia mais, peso ajusta
    waist = height * 0.38 + (weight * 0.12)
    hips = height * 0.54 + (weight * 0.18)

    // Ajuste fino baseado em idade (mulheres tendem a ter medidas maiores com idade)
    if (age > 30) {
      bust *= 1.02
      waist *= 1.03
      hips *= 1.02
    }
  } else {
    // Proporções médias para homens
    bust = height * 0.50 + (weight * 0.20) // Tórax mais desenvolvido
    waist = height * 0.40 + (weight * 0.15)
    hips = height * 0.48 + (weight * 0.12)

    // Ajuste fino baseado em idade
    if (age > 30) {
      waist *= 1.05 // Homens tendem a ganhar mais cintura
    }
  }

  return {
    bust: Math.round(bust),
    waist: Math.round(waist),
    hips: Math.round(hips)
  }
}

/**
 * Parseia um range de medidas (ex: "92 - 96" ou "92") e retorna o valor central
 */
function parseMeasurementRange(range: string): number {
  const trimmed = range.trim()

  // Se for um range (ex: "92 - 96")
  if (trimmed.includes('-')) {
    const parts = trimmed.split('-').map(p => p.trim())
    const min = parseFloat(parts[0])
    const max = parseFloat(parts[1] || parts[0])
    return (min + max) / 2
  }

  // Se for um valor único (ex: "92")
  const value = parseFloat(trimmed)
  return isNaN(value) ? 0 : value
}

/**
 * Calcula a diferença entre o valor do usuário e o range do produto
 * Retorna a diferença absoluta do valor do usuário até o centro do range
 */
function calculateDifference(userValue: number, productRange: string): number {
  const center = parseMeasurementRange(productRange)
  return Math.abs(userValue - center)
}

/**
 * Determina o status de uma medida (ok, justo, folgado)
 */
function getMeasurementStatus(
  userValue: number,
  productRange: string
): 'ok' | 'justo' | 'folgado' {
  const trimmed = productRange.trim()

  if (trimmed.includes('-')) {
    const parts = trimmed.split('-').map(p => parseFloat(p.trim()))
    const min = parts[0]
    const max = parts[1] || parts[0]

    if (userValue >= min && userValue <= max) {
      return 'ok'
    } else if (userValue < min) {
      return 'justo'
    } else {
      return 'folgado'
    }
  } else {
    const target = parseFloat(trimmed)
    const diff = Math.abs(userValue - target)

    if (diff <= 2) return 'ok'
    if (userValue < target) return 'justo'
    return 'folgado'
  }
}

/**
 * Recomenda o tamanho baseado nas medidas do usuário e na tabela do produto
 */
export function recommendSize(
  userMeasurements: UserMeasurements,
  sizeChart: ParsedSizeChart
): SizeRecommendation | null {
  if (!sizeChart || Object.keys(sizeChart).length === 0) {
    return null
  }

  // Mapear medidas do usuário para nomes possíveis na tabela
  const userMeasurementsMap: Record<string, number> = {
    busto: userMeasurements.bust,
    bust: userMeasurements.bust,
    cintura: userMeasurements.waist,
    waist: userMeasurements.waist,
    quadril: userMeasurements.hips,
    hips: userMeasurements.hips
  }

  // Calcular score para cada tamanho
  const sizeScores: Array<{
    size: string
    score: number
    comparison: SizeRecommendation['comparison']
  }> = []

  for (const [size, measurements] of Object.entries(sizeChart)) {
    let totalScore = 0
    const comparison: SizeRecommendation['comparison'] = []

    // Para cada medida encontrada na tabela
    for (const [measurementName, productRange] of Object.entries(measurements)) {
      const normalizedName = measurementName.toLowerCase()

      // Tentar encontrar correspondência com medidas do usuário
      let userValue: number | undefined

      if (normalizedName.includes('busto') || normalizedName.includes('bust')) {
        userValue = userMeasurements.bust
      } else if (normalizedName.includes('cintura') || normalizedName.includes('waist')) {
        userValue = userMeasurements.waist
      } else if (normalizedName.includes('quadril') || normalizedName.includes('hips')) {
        userValue = userMeasurements.hips
      }

      if (userValue !== undefined) {
        const difference = calculateDifference(userValue, productRange)
        const status = getMeasurementStatus(userValue, productRange)
        const center = parseMeasurementRange(productRange)

        // Peso da medida no score (cintura é mais crítica, mas ajustado)
        const weight = normalizedName.includes('cintura') || normalizedName.includes('waist') ? 1.3 : 1.0

        // Penalizar menos diferenças pequenas (até 2cm = diferença mínima)
        const adjustedDifference = difference <= 2 ? difference * 0.5 : difference

        totalScore += adjustedDifference * weight

        comparison.push({
          measurement: measurementName,
          userValue,
          productRange,
          productCenter: center,
          difference,
          status
        })
      }
    }

    if (comparison.length > 0) {
      sizeScores.push({
        size,
        score: totalScore,
        comparison
      })
    }
  }

  if (sizeScores.length === 0) {
    return null
  }

  // Ordenar por score (menor é melhor)
  sizeScores.sort((a, b) => a.score - b.score)

  const best = sizeScores[0]
  const second = sizeScores[1]

  // Determinar nível de ajuste baseado no score (refinado)
  // Score menor = melhor ajuste
  let fitLevel: FitLevel
  if (best.score < 4) {
    fitLevel = 'excelente' // Medidas muito próximas do ideal
  } else if (best.score < 12) {
    fitLevel = 'bom' // Ajuste bom, com pequenas diferenças
  } else {
    fitLevel = 'aproximado' // Ajuste aproximado, pode precisar de atenção
  }

  // Se houver empate próximo (diferença < 4), considerar tamanho alternativo
  let alternativeSize: string | undefined
  if (second && Math.abs(best.score - second.score) < 4) {
    alternativeSize = second.size
  }

  return {
    size: best.size,
    fitLevel,
    score: best.score,
    comparison: best.comparison,
    alternativeSize
  }
}

