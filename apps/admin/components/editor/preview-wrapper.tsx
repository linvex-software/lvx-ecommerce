'use client'

/**
 * Preview Wrapper
 * 
 * Wrapper de isolamento que bloqueia CSS do editor sem resetar estilos do template
 * Usa isolation: isolate para isolar sem quebrar os estilos do template
 */

import { ReactNode, useEffect, useRef } from 'react'
import { getTemplateStylesPath } from '@/lib/templates/template-loader'

interface PreviewWrapperProps {
  children: ReactNode
  templateId?: string
}

export function PreviewWrapper({ children, templateId = 'woman-shop-template' }: PreviewWrapperProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Garantir que o CSS do template seja carregado dentro do wrapper
    if (wrapperRef.current) {
      const existingLink = wrapperRef.current.querySelector('link[data-template-styles]')
      if (!existingLink) {
        const stylesPath = getTemplateStylesPath(templateId)
        const link = document.createElement('link')
        link.setAttribute('data-template-styles', 'true')
        link.href = stylesPath
        link.rel = 'stylesheet'
        wrapperRef.current.appendChild(link)
      }
    }
  }, [])

  return (
    <div 
      ref={wrapperRef}
      className="preview-wrapper"
      style={{
        // Garantir que o wrapper tenha as propriedades básicas
        display: 'block',
        width: '100%',
        minHeight: '100%',
        isolation: 'isolate',
        contain: 'style layout paint',
      }}
    >
      {children}
    </div>
  )
}

