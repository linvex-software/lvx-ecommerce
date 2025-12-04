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
    return layoutModule.default as Record<string, unknown>
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
      return {
        ...resolver,
        ...templateModule.componentResolver
      }
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
    
    return resolver
  } catch (error) {
    console.error(`Erro ao carregar componentes do template ${templateId}:`, error)
    throw error
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

