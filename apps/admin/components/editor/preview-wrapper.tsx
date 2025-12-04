'use client'

/**
 * Preview Wrapper
 * 
 * Wrapper de isolamento que bloqueia CSS do editor sem resetar estilos do template
 * Usa isolation: isolate para isolar sem quebrar os estilos do template
 */

import { ReactNode, useEffect, useRef } from 'react'

interface PreviewWrapperProps {
  children: ReactNode
}

export function PreviewWrapper({ children }: PreviewWrapperProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Garantir que o CSS do template seja carregado dentro do wrapper
    if (wrapperRef.current) {
      const existingLink = wrapperRef.current.querySelector('link[data-template-styles]')
      if (!existingLink) {
        const link = document.createElement('link')
        link.setAttribute('data-template-styles', 'true')
        link.href = '/templates/flor-de-menina/styles.css'
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

