'use client'

import { useEffect, useRef, createElement } from 'react'
import { generateBuilderId } from '@/lib/utils/builder-id'
import type { ElementStyles } from './types'

interface BuilderElementProps {
  elementId?: string
  styles?: ElementStyles
  children: React.ReactNode
  as?: keyof JSX.IntrinsicElements
  className?: string
  [key: string]: unknown
}

/**
 * Wrapper que adiciona data-builder-id e aplica estilos dinâmicos
 */
export function BuilderElement({ 
  elementId, 
  styles, 
  children, 
  as: Component = 'div',
  className = '',
  ...props 
}: BuilderElementProps) {
  const ref = useRef<HTMLElement | SVGElement>(null)
  const id = elementId || generateBuilderId()

  useEffect(() => {
    if (!ref.current) return
    
    // Verificar se o elemento tem a propriedade style (HTMLElement)
    const element = ref.current as HTMLElement
    if (!('style' in element)) return

    // Aplicar estilos diretamente no elemento
    if (styles) {
      Object.entries(styles).forEach(([key, value]) => {
        if (value) {
          // Converter camelCase para kebab-case
          const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase()
          element.style.setProperty(cssKey, value)
        }
      })
    }
  }, [styles])

  return createElement(
    Component,
    {
      ref,
      'data-builder-id': id,
      className,
      ...props,
    },
    children
  )
}












