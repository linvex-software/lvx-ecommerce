'use client'

import { useEffect, useRef } from 'react'
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
  const ref = useRef<HTMLElement>(null)
  const id = elementId || generateBuilderId()

  useEffect(() => {
    if (!ref.current) return

    // Aplicar estilos diretamente no elemento
    if (styles) {
      Object.entries(styles).forEach(([key, value]) => {
        if (value) {
          // Converter camelCase para kebab-case
          const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase()
          ref.current!.style.setProperty(cssKey, value)
        }
      })
    }
  }, [styles])

  return (
    <Component
      ref={ref}
      data-builder-id={id}
      className={className}
      {...props}
    >
      {children}
    </Component>
  )
}












