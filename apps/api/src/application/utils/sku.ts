/**
 * Gera um SKU automático único para um produto
 * 
 * Formato: SKU-{storeIdPrefix}-{random}
 * - storeIdPrefix: primeiros 8 caracteres do store_id (sem hífens)
 * - random: 6 caracteres alfanuméricos aleatórios
 */
export function generateSku(storeId: string): string {
  const storeIdPrefix = storeId.replace(/-/g, '').substring(0, 8).toUpperCase()
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `SKU-${storeIdPrefix}-${random}`
}

