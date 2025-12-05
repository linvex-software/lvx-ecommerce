/**
 * Registro centralizado de todos os templates
 * Templates são estruturas declarativas independentes do Craft.js
 */

import { Template } from './types'
import { cosmicFashionTemplate } from './cosmic-fashion'

export const templates: Template[] = [
  cosmicFashionTemplate
]

/**
 * Buscar template por ID
 */
export function getTemplateById(id: string): Template | undefined {
  return templates.find(t => t.id === id)
}

/**
 * Buscar templates por categoria
 */
export function getTemplatesByCategory(category: string): Template[] {
  return templates.filter(t => t.category === category)
}

/**
 * Listar todas as categorias disponíveis
 */
export function getTemplateCategories(): string[] {
  const categories = new Set(templates.map(t => t.category))
  return Array.from(categories)
}




