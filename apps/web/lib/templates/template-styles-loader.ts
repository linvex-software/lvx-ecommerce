/**
 * Sistema de carregamento dinâmico de estilos, tokens e fontes por template
 */

export interface TemplateStyles {
  stylesUrl: string
  tokensUrl: string
  fontsDir: string
}

/**
 * Carregar CSS do template dinamicamente
 */
export function loadTemplateStyles(templateId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof document === 'undefined') {
      resolve()
      return
    }

    // Verificar se já foi carregado
    const existingLink = document.getElementById(`template-styles-${templateId}`)
    if (existingLink) {
      resolve()
      return
    }

    const link = document.createElement('link')
    link.id = `template-styles-${templateId}`
    link.href = `/templates/${templateId}/styles.css`
    link.rel = 'stylesheet'
    link.onload = () => resolve()
    link.onerror = () => reject(new Error(`Failed to load styles for template: ${templateId}`))
    
    document.head.appendChild(link)
  })
}

/**
 * Carregar tokens CSS do template dinamicamente
 */
export function loadTemplateTokens(templateId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof document === 'undefined') {
      resolve()
      return
    }

    // Verificar se já foi carregado
    const existingLink = document.getElementById(`template-tokens-${templateId}`)
    if (existingLink) {
      resolve()
      return
    }

    const link = document.createElement('link')
    link.id = `template-tokens-${templateId}`
    link.href = `/templates/${templateId}/tokens.css`
    link.rel = 'stylesheet'
    link.onload = () => resolve()
    link.onerror = () => {
      // Tokens são opcionais, não falhar se não existir
      console.warn(`Tokens CSS not found for template: ${templateId}`)
      resolve()
    }
    
    document.head.appendChild(link)
  })
}

/**
 * Carregar fontes do template dinamicamente
 */
export function loadTemplateFonts(templateId: string): Promise<void> {
  return new Promise((resolve) => {
    if (typeof document === 'undefined') {
      resolve()
      return
    }

    // Fontes são carregadas via @font-face no CSS, então apenas verificar se o CSS foi carregado
    // Esta função existe para manter a API consistente e permitir extensões futuras
    resolve()
  })
}

/**
 * Carregar todos os estilos do template na ordem correta:
 * 1. Tokens (variáveis CSS)
 * 2. Fontes (via @font-face no CSS)
 * 3. Styles (estilos principais)
 */
export async function loadAllTemplateStyles(templateId: string): Promise<void> {
  try {
    // Ordem de carregamento: tokens → fontes → styles
    await loadTemplateTokens(templateId)
    await loadTemplateFonts(templateId)
    await loadTemplateStyles(templateId)
  } catch (error) {
    console.error(`Error loading template styles for ${templateId}:`, error)
    throw error
  }
}

/**
 * Remover estilos do template (útil para trocar de template)
 */
export function removeTemplateStyles(templateId: string): void {
  if (typeof document === 'undefined') return

  const stylesLink = document.getElementById(`template-styles-${templateId}`)
  const tokensLink = document.getElementById(`template-tokens-${templateId}`)

  if (stylesLink) {
    document.head.removeChild(stylesLink)
  }

  if (tokensLink) {
    document.head.removeChild(tokensLink)
  }
}


