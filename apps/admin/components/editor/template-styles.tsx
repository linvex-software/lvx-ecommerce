'use client'

/**
 * Componente que aplica os estilos globais do template no editor
 * 
 * NOTA: Com o isolamento via iframe (IsolatedPreviewFrame), este componente
 * é usado apenas para compatibilidade com RestrictedFrame (legacy).
 * 
 * O iframe isolado carrega os estilos diretamente do template, eliminando
 * a necessidade de overrides complexos.
 */

import { useEffect } from 'react'

interface TemplateStylesProps {
  templateId?: string
}

export function TemplateStyles({ templateId = 'flor-de-menina' }: TemplateStylesProps) {
  useEffect(() => {
    // Carregar estilos do template dinamicamente
    // Este código é mantido apenas para compatibilidade com RestrictedFrame
    if (typeof document === 'undefined') return

    const link = document.createElement('link')
    link.href = `/templates/${templateId}/styles.css`
    link.rel = 'stylesheet'
    link.id = `template-styles-${templateId}`
    
    // Verificar se já foi carregado
    if (document.getElementById(link.id)) {
      return
    }

    document.head.appendChild(link)

    return () => {
      const linkElement = document.getElementById(link.id)
      if (linkElement) {
        document.head.removeChild(linkElement)
      }
    }
  }, [templateId])

  return null
}
