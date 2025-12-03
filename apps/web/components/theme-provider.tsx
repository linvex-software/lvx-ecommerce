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

