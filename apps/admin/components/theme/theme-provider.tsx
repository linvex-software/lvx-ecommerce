'use client'

import { useEffect } from 'react'
import { useStoreTheme } from '@/lib/hooks/use-store-theme'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { data: theme, isLoading } = useStoreTheme()

  // Aplicar tema sempre, mesmo durante carregamento
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement
      
      // Aplicar cores do tema ou valores padrão
      const primaryColor = theme?.primary_color || '#000000'
      const secondaryColor = theme?.secondary_color || '#6366F1'
      const textColor = theme?.text_color || '#000000'
      const iconColor = theme?.icon_color || '#000000'
      
      root.style.setProperty('--store-primary-color', primaryColor)
      root.style.setProperty('--store-secondary-color', secondaryColor)
      root.style.setProperty('--store-text-color', textColor)
      root.style.setProperty('--store-icon-color', iconColor)
      
      // Aplicar também no Frame do Craft.js se existir
      const applyToFrame = () => {
        const frames = document.querySelectorAll('[data-craftjs-frame], .craftjs-frame, [class*="craftjs"]')
        frames.forEach((frame) => {
          if (frame instanceof HTMLElement) {
            frame.style.setProperty('--store-primary-color', primaryColor)
            frame.style.setProperty('--store-secondary-color', secondaryColor)
            frame.style.setProperty('--store-text-color', textColor)
            frame.style.setProperty('--store-icon-color', iconColor)
          }
        })
      }
      
      // Tentar aplicar no frame após delays para garantir que foi renderizado
      setTimeout(applyToFrame, 100)
      setTimeout(applyToFrame, 500)
    }
  }, [theme, isLoading])

  // Aplicar valores padrão imediatamente na montagem
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement
      // Garantir que as variáveis existam mesmo antes do tema carregar
      if (!root.style.getPropertyValue('--store-primary-color')) {
        root.style.setProperty('--store-primary-color', '#000000')
      }
      if (!root.style.getPropertyValue('--store-secondary-color')) {
        root.style.setProperty('--store-secondary-color', '#6366F1')
      }
      if (!root.style.getPropertyValue('--store-text-color')) {
        root.style.setProperty('--store-text-color', '#000000')
      }
      if (!root.style.getPropertyValue('--store-icon-color')) {
        root.style.setProperty('--store-icon-color', '#000000')
      }
    }
  }, [])

  return <>{children}</>
}

