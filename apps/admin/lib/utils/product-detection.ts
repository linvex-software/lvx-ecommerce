/**
 * Utilitários para detectar tipo de produto e gerar size_chart padrão
 */

/**
 * Palavras-chave que indicam que o produto é roupa/vestuário
 */
const CLOTHING_KEYWORDS = [
  // Roupas em geral
  'camiseta', 'camisa', 'blusa', 'blazer', 'casaco', 'jaqueta', 'moletom',
  'vestido', 'saia', 'calça', 'bermuda', 'short', 'calção',
  'regata', 'polo', 'camisola', 'pijama', 'lingerie',
  'sutiã', 'cueca', 'meia', 'meias',
  'terno', 'smoking', 'gravata',
  'biquíni', 'maiô', 'sunga',
  'legging', 'top', 'cropped',
  // Categorias comuns
  'roupa', 'vestuário', 'moda', 'fashion', 'apparel', 'clothing',
  'feminino', 'masculino', 'unissex', 'infantil'
]

/**
 * Palavras-chave que indicam que o produto NÃO é roupa
 */
const NON_CLOTHING_KEYWORDS = [
  'bolsa', 'mochila', 'carteira', 'necessaire',
  'óculos', 'oculos', 'relógio', 'relogio',
  'acessório', 'acessorio', 'bijuteria', 'joia',
  'perfume', 'cosmético', 'cosmetico',
  'calçado', 'calcado', 'sapato', 'tênis', 'tenis', 'chinelo',
  'cinto', 'carteira'
]

/**
 * Detecta se um produto é roupa/vestuário baseado no nome e categorias
 */
export function isClothingProduct(
  productName: string,
  categoryNames: string[] = []
): boolean {
  const searchText = `${productName} ${categoryNames.join(' ')}`.toLowerCase()

  // Primeiro verifica se tem palavras que indicam NÃO é roupa
  const hasNonClothingKeyword = NON_CLOTHING_KEYWORDS.some((keyword) =>
    searchText.includes(keyword)
  )

  if (hasNonClothingKeyword) {
    return false
  }

  // Depois verifica se tem palavras que indicam que É roupa
  const hasClothingKeyword = CLOTHING_KEYWORDS.some((keyword) =>
    searchText.includes(keyword)
  )

  return hasClothingKeyword
}

/**
 * Gera um size_chart padrão para produtos de roupa
 */
export function generateDefaultSizeChart(productName: string): {
  name: string
  chart_json: Record<string, Record<string, string>>
} {
  // Detectar se é roupa feminina, masculina ou unissex baseado no nome
  const nameLower = productName.toLowerCase()
  const isFeminine = nameLower.includes('feminin') ||
                     nameLower.includes('mulher') ||
                     nameLower.includes('dama')
  const isMasculine = nameLower.includes('masculin') ||
                      nameLower.includes('homem') ||
                      nameLower.includes('men')

  // Tabela padrão unissex (pode ser ajustada)
  const defaultChart: Record<string, Record<string, string>> = {
    'PP': {
      'Busto': '80 - 84',
      'Cintura': '62 - 66',
      'Quadril': '86 - 90'
    },
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
    },
    'GG': {
      'Busto': '108 - 112',
      'Cintura': '90 - 94',
      'Quadril': '118 - 122'
    }
  }

  // Ajustar para masculino (medidas maiores)
  if (isMasculine && !isFeminine) {
    Object.keys(defaultChart).forEach((size) => {
      const chart = defaultChart[size]
      if (chart['Busto']) {
        const bustRange = chart['Busto'].split(' - ').map(Number)
        chart['Busto'] = `${bustRange[0] + 8} - ${bustRange[1] + 8}`
      }
      if (chart['Cintura']) {
        const waistRange = chart['Cintura'].split(' - ').map(Number)
        chart['Cintura'] = `${waistRange[0] + 6} - ${waistRange[1] + 6}`
      }
      if (chart['Quadril']) {
        const hipsRange = chart['Quadril'].split(' - ').map(Number)
        chart['Quadril'] = `${hipsRange[0] + 4} - ${hipsRange[1] + 4}`
      }
    })
  }

  return {
    name: `Tabela de Medidas - ${productName}`,
    chart_json: defaultChart
  }
}

