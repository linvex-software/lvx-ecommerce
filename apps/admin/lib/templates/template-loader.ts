/**
 * Carregador de Templates
 * 
 * Carrega layouts e configurações de templates
 */

import React from 'react'

// Cache para evitar carregar o mesmo template múltiplas vezes
const templateResolverCache = new Map<string, Record<string, any>>()

export interface TemplateMetadata {
  id: string
  name: string
  description: string
  configPath: string
  layoutPath: string
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

export async function loadTemplateLayout(templateId: string): Promise<Record<string, unknown>> {
  try {
    // Importar diretamente o arquivo JSON
    // O caminho é relativo a partir da raiz do projeto
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

export async function loadTemplateConfig(templateId: string): Promise<Record<string, unknown>> {
  try {
    // Importar diretamente o arquivo JSON
    // O caminho é relativo a partir da raiz do projeto
    const configModule = await import(`../../../../templates/${templateId}/template.config.json`)
    return configModule.default as Record<string, unknown>
  } catch (error) {
    console.error(`Erro ao carregar config do template ${templateId}:`, error)
    throw error
  }
}


export async function loadTemplateComponents(templateId: string) {
  // Verificar cache primeiro
  if (templateResolverCache.has(templateId)) {
    return templateResolverCache.get(templateId)!
  }

  try {
    // Importar dinamicamente o módulo do template
    const templateModule = await import(`../../../../templates/${templateId}/index.ts`)
    
    // Criar resolver base com elementos HTML nativos que o Craft.js precisa
    // O Craft.js precisa de componentes React, não strings
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
    
    let finalResolver: Record<string, any>
    
    // Se o módulo exporta componentResolver diretamente, mesclar com o resolver base
    if (templateModule.componentResolver) {
      finalResolver = {
        ...resolver,
        ...templateModule.componentResolver
      }
      console.log('[template-loader] Resolver criado a partir de componentResolver do template')
      console.log('[template-loader] Componentes no resolver:', Object.keys(templateModule.componentResolver))
    } else {
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
      // Componentes para páginas dinâmicas (se exportados individualmente)
      if (templateModule.FAQ) resolver.FAQ = templateModule.FAQ
      if (templateModule.TextBlockCraft) resolver.TextBlock = templateModule.TextBlockCraft
      finalResolver = resolver
      console.log('[template-loader] Resolver criado a partir de exportações individuais')
    }
    
    // Verificar se FAQ e TextBlock estão no resolver
    if (!finalResolver.FAQ) {
      console.warn('[template-loader] FAQ não encontrado no resolver, tentando import dinâmico...')
      try {
        const { FAQ } = await import('@/components/store/faq')
        finalResolver.FAQ = FAQ
        console.log('[template-loader] FAQ adicionado via import dinâmico')
      } catch (error) {
        console.error('[template-loader] Erro ao importar FAQ:', error)
      }
    }
    
    if (!finalResolver.TextBlock) {
      console.warn('[template-loader] TextBlock não encontrado no resolver, tentando import dinâmico...')
      try {
        const { TextBlockCraft } = await import('@/components/editor/craft-blocks/TextBlockCraft')
        finalResolver.TextBlock = TextBlockCraft
        console.log('[template-loader] TextBlock adicionado via import dinâmico')
      } catch (error) {
        console.error('[template-loader] Erro ao importar TextBlock:', error)
      }
    }
    
    // Armazenar no cache
    templateResolverCache.set(templateId, finalResolver)
    
    console.log(`[template-loader] Resolver carregado para ${templateId}:`, Object.keys(finalResolver))
    return finalResolver
  } catch (error) {
    console.error(`Erro ao carregar componentes do template ${templateId}:`, error)
    throw error
  }
}

export function getAvailableTemplates(): TemplateMetadata[] {
  return [
    {
      id: 'flor-de-menina',
      name: 'Flor de Menina',
      description: 'Template elegante para lojas de moda feminina',
      configPath: '/templates/flor-de-menina/template.config.json',
      layoutPath: '/templates/flor-de-menina/layout.json'
    }
  ]
}

