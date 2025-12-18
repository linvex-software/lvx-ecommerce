'use client'

/**
 * Provider para gerenciar configurações do template
 */

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import type { TemplateConfig } from '../../../../templates/types'
import { loadTemplateConfig, applyTemplateConfig } from './template-loader'

interface TemplateContextType {
  config: TemplateConfig | null
  isLoading: boolean
  templateId: string | null
  updateConfig: (newConfig: Partial<TemplateConfig>) => void
}

const TemplateContext = createContext<TemplateContextType | undefined>(undefined)

interface TemplateProviderProps {
  children: ReactNode
  templateId: string
  initialConfig?: TemplateConfig
}

export function TemplateProvider({ 
  children, 
  templateId,
  initialConfig 
}: TemplateProviderProps) {
  const [config, setConfig] = useState<TemplateConfig | null>(initialConfig || null)
  const [isLoading, setIsLoading] = useState(!initialConfig)

  // Carregar estilos compartilhados do template (CÓPIA EXATA de template1)
  // Este é o ÚNICO lugar onde os estilos do template são carregados
  useEffect(() => {
    if (templateId === 'flor-de-menina' && typeof document !== 'undefined') {
      // Carregar CSS compartilhado do template (cópia exata de template1/flor-de-menina-boutique/src/index.css)
      const link = document.createElement('link')
      link.href = '/templates/flor-de-menina/styles.css'
      link.rel = 'stylesheet'
      link.id = 'template-shared-styles'
      document.head.appendChild(link)

      return () => {
        const linkElement = document.getElementById('template-shared-styles')
        if (linkElement) {
          document.head.removeChild(linkElement)
        }
      }
    }
  }, [templateId])
  
  /* NOTA: Não aplicamos mais variáveis CSS via JavaScript aqui.
     Todas as variáveis CSS estão definidas no arquivo CSS compartilhado
     templates/flor-de-menina/styles.css, que é uma cópia exata do template original.
     Isso garante que web e editor usem EXATAMENTE os mesmos estilos, sem abstrações. */

  useEffect(() => {
    if (initialConfig) {
      setConfig(initialConfig)
      applyTemplateConfig(initialConfig, templateId)
      setIsLoading(false)
      return
    }

    // Carregar configuração da API
    const loadFromAPI = async () => {
      try {
        const { fetchAPI } = await import('@/lib/api')
        const data = await fetchAPI('/settings/template/public') as { config?: TemplateConfig }
        if (data?.config) {
          setConfig(data.config)
          applyTemplateConfig(data.config, templateId)
          setIsLoading(false)
          return
        }
      } catch (error) {
        console.warn('Erro ao carregar config da API, usando padrão:', error)
      }

      // Fallback: carregar do arquivo local
      loadTemplateConfig(templateId)
        .then((loadedConfig) => {
          setConfig(loadedConfig)
          applyTemplateConfig(loadedConfig, templateId)
          setIsLoading(false)
        })
        .catch((error) => {
          console.error('Erro ao carregar template:', error)
          setIsLoading(false)
        })
    }

    loadFromAPI()
  }, [templateId, initialConfig])

  // Aplicar configuração sempre que mudar
  useEffect(() => {
    if (config) {
      applyTemplateConfig(config, templateId)
    }
  }, [config, templateId])

  const updateConfig = (newConfig: Partial<TemplateConfig>) => {
    if (config) {
      const updated = {
        ...config,
        ...newConfig,
        theme: { ...config.theme, ...newConfig.theme },
        branding: { ...config.branding, ...newConfig.branding },
        content: { ...config.content, ...newConfig.content }
      }
      setConfig(updated)
    }
  }

  return (
    <TemplateContext.Provider value={{ config, isLoading, templateId, updateConfig }}>
      {children}
    </TemplateContext.Provider>
  )
}

export function useTemplate() {
  const context = useContext(TemplateContext)
  if (context === undefined) {
    throw new Error('useTemplate must be used within a TemplateProvider')
  }
  return context
}

