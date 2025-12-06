/**
 * Normaliza uma string para formato de slug URL-friendly
 * 
 * Regras aplicadas:
 * - Transforma em minúsculas
 * - Remove acentos
 * - Substitui espaços e caracteres separadores por -
 * - Remove caracteres não alfanuméricos (exceto -)
 * - Colapsa múltiplos - em um único
 * - Remove - no início/fim
 */
export function normalizeSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9]+/g, '-') // Substitui caracteres não alfanuméricos por -
    .replace(/^-+|-+$/g, '') // Remove - no início e fim
    .replace(/-+/g, '-') // Colapsa múltiplos - em um único
}

