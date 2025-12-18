export interface ReviewTag {
  tag: string
  rating: number
}

// Tags pré-definidas por rating (conforme especificação)
export const REVIEW_TAGS_BY_RATING: Record<number, string[]> = {
  5: ['Amei', 'Produto excelente', 'Chegou rápido', 'Bem embalado', 'Voltaria a comprar'],
  4: ['Gostei', 'Bom custo-benefício', 'Chegou no prazo', 'Qualidade boa', 'Pequenos detalhes'],
  3: ['Ok', 'Dentro do esperado', 'Poderia ser melhor', 'Entrega mediana', 'Embalagem ok'],
  2: ['Não gostei', 'Qualidade abaixo', 'Problema na entrega', 'Embalagem ruim', 'Não compraria de novo'],
  1: ['Odiei', 'Veio errado', 'Chegou atrasado', 'Produto com defeito', 'Experiência péssima']
}

export function getTagsForRating(rating: number): string[] {
  return REVIEW_TAGS_BY_RATING[rating] || []
}

export function isValidTagForRating(tag: string, rating: number): boolean {
  const validTags = getTagsForRating(rating)
  return validTags.includes(tag)
}

