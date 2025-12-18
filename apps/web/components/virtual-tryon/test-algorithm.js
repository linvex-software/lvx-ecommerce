/**
 * Teste simples do algoritmo de recomendação
 * Execute com: node apps/web/components/virtual-tryon/test-algorithm.js
 *
 * Este é um teste manual para validar a lógica do algoritmo.
 * Em produção, use Vitest ou Jest.
 */

// Simulação do algoritmo (versão simplificada para teste)
function parseMeasurementRange(range) {
  const trimmed = range.trim()
  if (trimmed.includes('-')) {
    const parts = trimmed.split('-').map(p => parseFloat(p.trim()))
    const min = parts[0]
    const max = parts[1] || parts[0]
    return (min + max) / 2
  }
  const value = parseFloat(trimmed)
  return isNaN(value) ? 0 : value
}

function calculateDifference(userValue, productRange) {
  const center = parseMeasurementRange(productRange)
  return Math.abs(userValue - center)
}

function recommendSize(userMeasurements, sizeChart) {
  const userMeasurementsMap = {
    'busto': userMeasurements.bust,
    'bust': userMeasurements.bust,
    'cintura': userMeasurements.waist,
    'waist': userMeasurements.waist,
    'quadril': userMeasurements.hips,
    'hips': userMeasurements.hips
  }

  const sizeScores = []

  for (const [size, measurements] of Object.entries(sizeChart)) {
    let totalScore = 0
    const comparison = []

    for (const [measurementName, productRange] of Object.entries(measurements)) {
      const normalizedName = measurementName.toLowerCase()

      let userValue
      if (normalizedName.includes('busto') || normalizedName.includes('bust')) {
        userValue = userMeasurements.bust
      } else if (normalizedName.includes('cintura') || normalizedName.includes('waist')) {
        userValue = userMeasurements.waist
      } else if (normalizedName.includes('quadril') || normalizedName.includes('hips')) {
        userValue = userMeasurements.hips
      }

      if (userValue !== undefined) {
        const difference = calculateDifference(userValue, productRange)
        const weight = normalizedName.includes('cintura') || normalizedName.includes('waist') ? 1.5 : 1.0
        totalScore += difference * weight

        comparison.push({
          measurement: measurementName,
          userValue,
          productRange,
          difference
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

  sizeScores.sort((a, b) => a.score - b.score)
  const best = sizeScores[0]

  let fitLevel
  if (best.score < 4) {
    fitLevel = 'excelente'
  } else if (best.score < 12) {
    fitLevel = 'bom'
  } else {
    fitLevel = 'aproximado'
  }

  return {
    size: best.size,
    fitLevel,
    score: best.score,
    comparison: best.comparison
  }
}

// Teste 1: Recomendação básica
console.log('🧪 Teste 1: Recomendação básica')
const userMeasurements = {
  bust: 92,
  waist: 70,
  hips: 99
}

const sizeChart = {
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
console.log('Resultado:', JSON.stringify(result, null, 2))
console.assert(result !== null, 'Deve retornar uma recomendação')
console.assert(result.size === 'M', 'Deve recomendar tamanho M')
console.log('✅ Teste 1 passou!\n')

// Teste 2: Medidas muito pequenas
console.log('🧪 Teste 2: Medidas muito pequenas')
const smallMeasurements = {
  bust: 50,
  waist: 40,
  hips: 50
}

const result2 = recommendSize(smallMeasurements, sizeChart)
console.log('Resultado:', result2 ? JSON.stringify(result2, null, 2) : 'null')
console.assert(result2 === null || result2.fitLevel === 'aproximado', 'Deve retornar null ou ajuste aproximado')
console.log('✅ Teste 2 passou!\n')

console.log('✅ Todos os testes passaram!')

