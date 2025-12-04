'use client'

import { Suspense, useEffect, useState, useRef, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { Editor, useEditor } from '@craftjs/core'
import { useAuthStore } from '@/store/auth-store'
import { apiClient } from '@/lib/api-client'
import { EditorSettingsPanel } from '@/components/editor/editor-settings-panel'
import { EditorTopbar } from '@/components/editor/editor-topbar'
import { TemplateSelector } from '@/components/editor/template-selector'
import { RestrictedFrame } from '@/components/editor/restricted-frame'
import { PreviewProvider, usePreviewMode } from '@/components/editor/preview-context'
import { ThemeProvider } from '@/components/theme/theme-provider'
import { loadTemplateLayout, loadTemplateConfig, loadTemplateComponents } from '@/lib/templates/template-loader'
import { EditorCartProvider } from '@/components/editor/editor-cart-provider'

function EditorContent() {
  const searchParams = useSearchParams()
  const isPreview = searchParams.get('preview') === 'true'
  const user = useAuthStore((state) => state.user)
  const [savedLayout, setSavedLayout] = useState<Record<string, unknown> | null | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTemplate, setSelectedTemplate] = useState<string>('flor-de-menina')
  const [templateResolver, setTemplateResolver] = useState<Record<string, any>>({})
  const [templateConfig, setTemplateConfig] = useState<Record<string, unknown> | null>(null)

  // Carregar template inicial
  useEffect(() => {
    const loadInitialTemplate = async () => {
      try {
        // Tentar carregar template salvo da loja (opcional - rota pode não existir ainda)
        // A rota correta é /settings/template, não /settings/template/current
        try {
          const savedTemplateResponse = await apiClient.get<{ config?: { templateId?: string } }>('/settings/template')
          if (savedTemplateResponse.data?.config?.templateId) {
            setSelectedTemplate(savedTemplateResponse.data.config.templateId)
          }
        } catch (error: any) {
          // Se não houver template salvo ou rota não existir, usar o padrão
          // Não logar erro 404, é esperado que a rota não exista ainda
          // Apenas logar outros erros
          if (error?.response?.status !== 404) {
            console.warn('Erro ao carregar template salvo:', error)
          }
        }

        // Carregar componentes do template primeiro
        const resolver = await loadTemplateComponents(selectedTemplate)
        setTemplateResolver(resolver)

        // Carregar configuração do template
        const config = await loadTemplateConfig(selectedTemplate)
        setTemplateConfig(config)
        applyTemplateConfig(config)

        // Carregar layout padrão do template
        const defaultLayout = await loadTemplateLayout(selectedTemplate)

        // Carregar layout do template ou layout personalizado salvo
        if (!user?.storeId) {
          setSavedLayout(defaultLayout)
          setIsLoading(false)
          return
        }

        try {
          const response = await apiClient.get<{
            layout_json: Record<string, unknown> | null
            updated_at?: string
          }>('/editor/layout/admin')

          if (response.data?.layout_json) {
            // Usar layout salvo se existir
            setSavedLayout(response.data.layout_json)
          } else {
            // Se não houver layout salvo, usar layout padrão do template
            setSavedLayout(defaultLayout)
          }
        } catch (error) {
          // Se não houver layout salvo, usar layout padrão do template
          setSavedLayout(defaultLayout)
        }
      } catch (error) {
        console.error('Erro ao carregar template:', error)
        setSavedLayout(null)
      } finally {
        setIsLoading(false)
      }
    }

    loadInitialTemplate()
  }, [user?.storeId, selectedTemplate])

  const applyTemplateConfig = (config: Record<string, unknown>, templateId?: string) => {
    if (typeof document === 'undefined') return

    const root = document.documentElement
    const theme = config.theme as Record<string, string> | undefined

    if (theme) {
      // Aplicar apenas variáveis específicas da configuração do template
      root.style.setProperty('--template-primary-color', theme.primaryColor || '#C2185B')
      root.style.setProperty('--template-secondary-color', theme.secondaryColor || '#F8E8EC')
      root.style.setProperty('--template-background-color', theme.backgroundColor || '#FFFFFF')
      root.style.setProperty('--template-button-color', theme.buttonColor || '#C2185B')
      root.style.setProperty('--template-text-color', theme.textColor || '#333333')
      
      // Converter para HSL para compatibilidade com Tailwind (mesmo da web)
      const hexToHsl = (hex: string): string => {
        hex = hex.replace('#', '')
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
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
            case g: h = ((b - r) / d + 2) / 6; break
            case b: h = ((r - g) / d + 4) / 6; break
          }
        }
        return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
      }

      root.style.setProperty('--template-primary-hsl', hexToHsl(theme.primaryColor || '#C2185B'))
      root.style.setProperty('--template-secondary-hsl', hexToHsl(theme.secondaryColor || '#F8E8EC'))
      root.style.setProperty('--template-button-hsl', hexToHsl(theme.buttonColor || '#C2185B'))
      root.style.setProperty('--template-text-hsl', hexToHsl(theme.textColor || '#333333'))
    }

    /* NOTA: Não aplicamos mais as variáveis CSS principais do template aqui (--background, --foreground, etc.)
       porque elas estão todas definidas no arquivo CSS compartilhado templates/flor-de-menina/styles.css,
       que é uma cópia exata do template original template1/flor-de-menina-boutique/src/index.css.
       Isso garante que web e editor usem EXATAMENTE os mesmos estilos, sem abstrações. */
  }

  const handleTemplateSelect = async (templateId: string) => {
    setIsLoading(true)
    try {
      setSelectedTemplate(templateId)

      // Carregar componentes do novo template
      const resolver = await loadTemplateComponents(templateId)
      setTemplateResolver(resolver)

      // Carregar configuração
      const config = await loadTemplateConfig(templateId)
      setTemplateConfig(config)
      applyTemplateConfig(config, templateId)

      // Carregar layout padrão do template
      const defaultLayout = await loadTemplateLayout(templateId)
      setSavedLayout(defaultLayout)

      // Salvar template selecionado (opcional - rota pode não existir ainda)
      try {
        await apiClient.post('/settings/template/select', { templateId })
      } catch (error) {
        // Não logar erro, é esperado que a rota não exista ainda
      }
    } catch (error) {
      console.error('Erro ao carregar template:', error)
      alert('Erro ao carregar template. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading || savedLayout === undefined) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-sm text-gray-500">Carregando editor...</div>
      </div>
    )
  }

  return (
    <ThemeProvider>
      <PreviewProvider>
        <div className="h-full flex flex-col overflow-hidden">
          <Editor
            resolver={templateResolver}
            enabled={!isPreview}
          >
            <EditorContentInner 
              savedLayout={savedLayout} 
              isPreview={isPreview}
              onTemplateSelect={handleTemplateSelect}
              selectedTemplate={selectedTemplate}
              templateResolver={templateResolver}
            />
          </Editor>
        </div>
      </PreviewProvider>
    </ThemeProvider>
  )
}

function EditorContentInner({ 
  savedLayout, 
  isPreview,
  onTemplateSelect,
  selectedTemplate,
  templateResolver
}: { 
  savedLayout: Record<string, unknown> | null
  isPreview: boolean
  onTemplateSelect: (templateId: string) => void
  selectedTemplate: string
  templateResolver: Record<string, any>
}) {
  // Converter layout para JSON string para usar na prop data do Frame
  const layoutJson = savedLayout ? JSON.stringify(savedLayout) : null
  const { previewMode } = usePreviewMode()
  const frameRef = useRef<HTMLDivElement>(null)
  const { enabled } = useEditor((state: any) => ({
    enabled: state.options.enabled
  }))
  
  // Aplicar tema no Frame do Craft.js
  useEffect(() => {
    const applyThemeToFrame = () => {
      if (frameRef.current) {
        const computedStyle = getComputedStyle(document.documentElement)
        const primaryColor = computedStyle.getPropertyValue('--template-primary-color').trim()
        const secondaryColor = computedStyle.getPropertyValue('--template-secondary-color').trim()
        const textColor = computedStyle.getPropertyValue('--template-text-color').trim()
        
        if (primaryColor) {
          frameRef.current.style.setProperty('--template-primary-color', primaryColor)
        }
        if (secondaryColor) {
          frameRef.current.style.setProperty('--template-secondary-color', secondaryColor)
        }
        if (textColor) {
          frameRef.current.style.setProperty('--template-text-color', textColor)
        }
      }
    }
    
    applyThemeToFrame()
    const timer = setTimeout(applyThemeToFrame, 100)
    return () => clearTimeout(timer)
  }, [])

  // Interceptar cliques em links quando o editor está habilitado
  useEffect(() => {
    if (!enabled || isPreview) return

    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const link = target.closest('a')
      
      if (link) {
        e.preventDefault()
        e.stopPropagation()
        return false
      }
    }

    const frameElement = frameRef.current
    if (frameElement) {
      frameElement.addEventListener('click', handleLinkClick, true)
      return () => {
        frameElement.removeEventListener('click', handleLinkClick, true)
      }
    }
  }, [enabled, isPreview])

  // Tamanhos de preview para cada dispositivo
  const previewSizes = {
    desktop: {
      maxWidth: '100%',
      width: '100%',
      minHeight: '100%'
    },
    tablet: {
      maxWidth: '768px',
      width: '768px',
      minHeight: '1024px'
    },
    mobile: {
      maxWidth: '375px',
      width: '375px',
      minHeight: '667px'
    }
  }

  const currentSize = previewSizes[previewMode]

  return (
    <>
      <EditorTopbar isPreview={isPreview} />
      <div className="flex-1 flex overflow-hidden bg-white">
        {!isPreview && (
          <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto h-full flex flex-col">
            <TemplateSelector onTemplateSelect={onTemplateSelect} selectedTemplate={selectedTemplate} />
          </div>
        )}
        <div className="flex-1 overflow-y-auto overflow-x-hidden bg-gray-50 flex items-start justify-center p-4 md:p-10">
          <div 
            ref={frameRef}
            className="bg-white shadow-lg transition-all duration-300"
            style={{ 
              width: currentSize.width,
              maxWidth: currentSize.maxWidth,
              minHeight: currentSize.minHeight,
              fontFamily: 'var(--font-body, "Montserrat", system-ui, sans-serif)',
              backgroundColor: 'hsl(var(--background, 0 0% 100%))',
              color: 'hsl(var(--foreground, 0 0% 12%))',
              margin: 0,
              isolation: 'isolate', // Isolar do CSS do admin
            }}
          >
            {layoutJson ? (
              <RestrictedFrame data={layoutJson} />
            ) : (
              <div className="p-8 text-center text-gray-500">
                <p>Selecione um template para começar</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default function EditorPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center">
          <div className="text-sm text-gray-500">Carregando editor...</div>
        </div>
      }
    >
      <EditorContent />
    </Suspense>
  )
}
