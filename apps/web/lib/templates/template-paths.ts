/**
 * Constantes de caminhos do template
 * 
 * Centraliza os caminhos físicos do template para facilitar manutenção futura.
 * O diretório físico ainda é 'flor-de-menina', mas o templateId lógico é 'woman-shop-template'.
 */

/**
 * Caminho base dos componentes do template
 * Este é o diretório físico real onde os componentes estão localizados
 */
export const TEMPLATE_COMPONENTS_PATH = 'flor-de-menina'

/**
 * Helper para construir caminhos de importação dos componentes do template
 */
export function getTemplateComponentPath(componentPath: string): string {
  return `@/components/template/${TEMPLATE_COMPONENTS_PATH}/${componentPath}`
}

