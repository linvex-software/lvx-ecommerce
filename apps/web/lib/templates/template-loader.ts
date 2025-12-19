/**
 * Sistema de carregamento de templates
 * 
 * Carrega templates dinamicamente e aplica configurações
 */

import type { TemplateConfig } from '../../../../templates/types'
import React from 'react'

export interface TemplateMetadata {
  id: string
  name: string
  description: string
  configPath: string
}

/**
 * Carrega a configuração de um template
 */
export async function loadTemplateConfig(templateId: string): Promise<TemplateConfig> {
  try {
    // Importar diretamente o arquivo JSON
    // O caminho é relativo a partir da raiz do projeto
    const configModule = await import(`../../../../templates/${templateId}/template.config.json`)
    return configModule.default as TemplateConfig
  } catch (error) {
    console.error(`Erro ao carregar config do template ${templateId}:`, error)
    // Retorna configuração padrão
    return getDefaultConfig()
  }
}

/**
 * Aplica as configurações do template como CSS variables
 * 
 * NOTA: As variáveis CSS principais do template (--background, --foreground, --primary, etc.)
 * estão definidas no arquivo CSS compartilhado templates/flor-de-menina/styles.css
 * (cópia exata de template1/flor-de-menina-boutique/src/index.css).
 * 
 * Aqui aplicamos apenas variáveis específicas da configuração do template (--template-*).
 */
export function applyTemplateConfig(config: TemplateConfig, templateId?: string): void {
  if (typeof document === 'undefined') return

  const root = document.documentElement

  // Aplicar apenas cores do tema específicas da configuração
  root.style.setProperty('--template-primary-color', config.theme.primaryColor)
  root.style.setProperty('--template-secondary-color', config.theme.secondaryColor)
  root.style.setProperty('--template-background-color', config.theme.backgroundColor)
  root.style.setProperty('--template-button-color', config.theme.buttonColor)
  root.style.setProperty('--template-text-color', config.theme.textColor)

  // Converter cores hex para HSL se necessário (para compatibilidade com Tailwind)
  const primaryHsl = hexToHsl(config.theme.primaryColor)
  const secondaryHsl = hexToHsl(config.theme.secondaryColor)
  const buttonHsl = hexToHsl(config.theme.buttonColor)
  const textHsl = hexToHsl(config.theme.textColor)

  root.style.setProperty('--template-primary-hsl', primaryHsl)
  root.style.setProperty('--template-secondary-hsl', secondaryHsl)
  root.style.setProperty('--template-button-hsl', buttonHsl)
  root.style.setProperty('--template-text-hsl', textHsl)
  
  /* NOTA: Não aplicamos mais as variáveis CSS principais do template aqui (--background, --foreground, etc.)
     porque elas estão todas definidas no arquivo CSS compartilhado templates/flor-de-menina/styles.css,
     que é uma cópia exata do template original template1/flor-de-menina-boutique/src/index.css.
     Isso garante que web e editor usem EXATAMENTE os mesmos estilos, sem abstrações. */
}

/**
 * Converte cor hex para HSL
 */
function hexToHsl(hex: string): string {
  // Remove o # se existir
  hex = hex.replace('#', '')
  
  // Converte para RGB
  const r = parseInt(hex.substring(0, 2), 16) / 255
  const g = parseInt(hex.substring(2, 4), 16) / 255
  const b = parseInt(hex.substring(4, 6), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      case b:
        h = ((r - g) / d + 4) / 6
        break
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
}

/**
 * Retorna configuração padrão
 */
function getDefaultConfig(): TemplateConfig {
  return {
    theme: {
      primaryColor: '#C2185B',
      secondaryColor: '#F8E8EC',
      backgroundColor: '#FFFFFF',
      buttonColor: '#C2185B',
      textColor: '#333333'
    },
    branding: {
      logoUrl: '/logo.png',
      faviconUrl: '/favicon.ico',
      storeName: 'Flor de Menina Boutique'
    },
    content: {
      home: {
        heroTitle: 'Nova Coleção',
        heroSubtitle: 'Elegância que transforma'
      },
      footer: {
        policyText: 'Política de Trocas e Devoluções'
      }
    }
  }
}

/**
 * Carrega o layout JSON do template
 */
export async function loadTemplateLayout(templateId: string): Promise<Record<string, unknown>> {
  try {
    const layoutModule = await import(`../../../../templates/${templateId}/layout.json`)
    const layout = layoutModule.default as Record<string, unknown>
    
    // Validar que o layout tem ROOT
    if (!layout || !layout.ROOT) {
      console.error(`[loadTemplateLayout] Layout do template ${templateId} não tem ROOT válido`)
      throw new Error(`Layout do template ${templateId} é inválido: falta ROOT`)
    }
    
    console.log(`[loadTemplateLayout] Layout carregado para ${templateId}:`, {
      hasRoot: !!layout.ROOT,
      totalNodes: Object.keys(layout).length,
      rootNodes: (layout.ROOT as any)?.nodes?.length || 0
    })
    
    return layout
  } catch (error) {
    console.error(`Erro ao carregar layout do template ${templateId}:`, error)
    throw error
  }
}

/**
 * Cria componentes React para elementos HTML nativos
 * que o Craft.js precisa no resolver
 */
function createNativeElement(tagName: string) {
  return React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
    (props, ref) => {
      return React.createElement(tagName, { ...props, ref })
    }
  )
}

/**
 * Carrega os componentes do template
 */
export async function loadTemplateComponents(templateId: string) {
  try {
    const templateModule = await import(`../../../../templates/${templateId}/index.ts`)
    
    // Criar resolver base com elementos HTML nativos que o Craft.js precisa
    const resolver: Record<string, any> = {
      // Elementos HTML nativos que o Craft.js usa
      div: createNativeElement('div'),
      span: createNativeElement('span'),
      p: createNativeElement('p'),
      a: createNativeElement('a'),
      img: createNativeElement('img'),
      button: createNativeElement('button'),
      input: createNativeElement('input'),
      textarea: createNativeElement('textarea'),
      select: createNativeElement('select'),
      option: createNativeElement('option'),
      form: createNativeElement('form'),
      label: createNativeElement('label'),
      h1: createNativeElement('h1'),
      h2: createNativeElement('h2'),
      h3: createNativeElement('h3'),
      h4: createNativeElement('h4'),
      h5: createNativeElement('h5'),
      h6: createNativeElement('h6'),
      ul: createNativeElement('ul'),
      ol: createNativeElement('ol'),
      li: createNativeElement('li'),
      section: createNativeElement('section'),
      article: createNativeElement('article'),
      header: createNativeElement('header'),
      footer: createNativeElement('footer'),
      nav: createNativeElement('nav'),
      main: createNativeElement('main'),
      aside: createNativeElement('aside'),
    }
    
    // Se o módulo exporta componentResolver diretamente, mesclar com o resolver base
    if (templateModule.componentResolver) {
      const finalResolver = {
        ...resolver,
        ...templateModule.componentResolver
      }
      console.log('[loadTemplateComponents] Resolver criado com componentResolver:', {
        totalKeys: Object.keys(finalResolver).length,
        componentKeys: Object.keys(templateModule.componentResolver),
        hasHeader: 'Header' in finalResolver,
        hasFooter: 'Footer' in finalResolver,
        hasHeroBanner: 'HeroBanner' in finalResolver
      })
      return finalResolver
    }
    
    // Caso contrário, construir o resolver a partir das exportações
    if (templateModule.Header) resolver.Header = templateModule.Header
    if (templateModule.Footer) resolver.Footer = templateModule.Footer
    if (templateModule.HeroBanner) resolver.HeroBanner = templateModule.HeroBanner
    if (templateModule.ProductShowcase) resolver.ProductShowcase = templateModule.ProductShowcase
    if (templateModule.CategoryBanner) resolver.CategoryBanner = templateModule.CategoryBanner
    if (templateModule.PromoBanner) resolver.PromoBanner = templateModule.PromoBanner
    if (templateModule.InstagramFeed) resolver.InstagramFeed = templateModule.InstagramFeed
    if (templateModule.EditableText) resolver.EditableText = templateModule.EditableText
    if (templateModule.EditableButton) resolver.EditableButton = templateModule.EditableButton
    
    console.log('[loadTemplateComponents] Resolver criado a partir de exportações individuais:', {
      totalKeys: Object.keys(resolver).length,
      componentKeys: Object.keys(resolver).filter(k => !['div', 'span', 'p', 'a', 'img', 'button'].includes(k))
    })
    
    return resolver
  } catch (error) {
    console.error(`Erro ao carregar componentes do template ${templateId}:`, error)
    throw error
  }
}

/**
 * Carrega CSS do template dinamicamente
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
 * Carrega tokens CSS do template dinamicamente
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
 * Carrega fontes do template dinamicamente
 */
export function loadTemplateFonts(templateId: string): Promise<void> {
  return new Promise((resolve) => {
    if (typeof document === 'undefined') {
      resolve()
      return
    }

    // Fontes são carregadas via @font-face no CSS, então apenas verificar se o CSS foi carregado
    resolve()
  })
}

/**
 * Carrega todos os estilos do template na ordem correta:
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
 * Remove estilos do template (útil para trocar de template)
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

/**
 * Lista todos os templates disponíveis
 */
export function getAvailableTemplates(): TemplateMetadata[] {
  return [
    {
      id: 'flor-de-menina',
      name: 'Flor de Menina',
      description: 'Template elegante para lojas de moda feminina',
      configPath: '/templates/flor-de-menina/template.config.json'
    }
  ]
}

