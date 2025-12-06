/**
 * Utilitários para gerenciar IDs únicos de elementos no builder
 */

let elementIdCounter = 0

/**
 * Gera um ID único para um elemento do builder
 */
export function generateBuilderId(prefix = 'element'): string {
  elementIdCounter++
  return `${prefix}-${Date.now()}-${elementIdCounter}`
}

/**
 * Extrai o ID do builder de um elemento
 */
export function getBuilderId(element: HTMLElement | null): string | null {
  if (!element) return null
  
  // Buscar no próprio elemento
  if (element.dataset.builderId) {
    return element.dataset.builderId
  }
  
  // Buscar no elemento pai mais próximo
  let current: HTMLElement | null = element.parentElement
  while (current) {
    if (current.dataset.builderId) {
      return current.dataset.builderId
    }
    current = current.parentElement
  }
  
  return null
}

/**
 * Encontra um elemento pelo builder ID
 */
export function findElementByBuilderId(id: string): HTMLElement | null {
  return document.querySelector(`[data-builder-id="${id}"]`) as HTMLElement | null
}












