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
import { validateAndCleanLayout, createSafeDefaultLayout } from '@/lib/templates/layout-validator'
import { EditorCartProvider } from '@/components/editor/editor-cart-provider'
import { DeviceFrameset } from 'react-device-frameset'
import 'react-device-frameset/styles/marvel-devices.min.css'

function EditorContent() {
  const searchParams = useSearchParams()
  const isPreview = searchParams.get('preview') === 'true'
  const user = useAuthStore((state) => state.user)
  const [savedLayout, setSavedLayout] = useState<Record<string, unknown> | null | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTemplate, setSelectedTemplate] = useState<string>('woman-shop-template')
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

        // Carregar layout padrão do template PRIMEIRO
        const defaultLayout = await loadTemplateLayout(selectedTemplate)
        console.log('[Editor] Layout padrão carregado:', {
          hasRoot: !!defaultLayout?.ROOT,
          totalNodes: Object.keys(defaultLayout || {}).length,
          rootNodes: (defaultLayout?.ROOT as any)?.nodes?.length || 0
        })

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

          if (response.data?.layout_json && response.data.layout_json.ROOT) {
            // Usar layout salvo se existir E tiver ROOT válido
            const savedLayoutData = response.data.layout_json
            const savedNodeCount = Object.keys(savedLayoutData).length
            const savedRootNodes = (savedLayoutData.ROOT as any)?.nodes?.length || 0
            
            console.log('[Editor] Layout salvo do banco:', {
              hasRoot: !!savedLayoutData.ROOT,
              totalNodes: savedNodeCount,
              rootNodes: savedRootNodes
            })
            
            // Se o layout salvo tiver estrutura válida, usar ele
            if (savedNodeCount > 1 && savedRootNodes > 0) {
              setSavedLayout(savedLayoutData)
            } else {
              // Layout salvo está vazio ou inválido, usar padrão
              console.warn('[Editor] Layout salvo está vazio ou inválido, usando layout padrão')
              setSavedLayout(defaultLayout)
            }
          } else {
            // Se não houver layout salvo ou não tiver ROOT, usar layout padrão do template
            console.log('[Editor] Usando layout padrão do template (sem layout salvo ou inválido)')
            setSavedLayout(defaultLayout)
          }
        } catch (error) {
          // Se não houver layout salvo, usar layout padrão do template
          console.log('[Editor] Erro ao carregar layout salvo, usando padrão:', error)
          setSavedLayout(defaultLayout)
        }
      } catch (error) {
        console.error('Erro ao carregar template:', error)
        // Em caso de erro, tentar carregar pelo menos o layout padrão do template
        try {
          const fallbackLayout = await loadTemplateLayout(selectedTemplate)
          setSavedLayout(fallbackLayout)
        } catch (fallbackError) {
          console.error('Erro ao carregar layout padrão:', fallbackError)
          // Último recurso: layout vazio seguro
          setSavedLayout(null)
        }
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
       porque elas estão todas definidas no arquivo CSS compartilhado do template (obtido via getTemplateStylesPath),
       que é uma cópia exata do template original.
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
      console.log('[Editor] Layout padrão carregado ao trocar template:', {
        hasRoot: !!defaultLayout?.ROOT,
        totalNodes: Object.keys(defaultLayout || {}).length,
        rootNodes: (defaultLayout?.ROOT as any)?.nodes?.length || 0
      })
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
  savedLayout: savedLayoutProp, 
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
  // Se o layout não tem ROOT válido, usar layout padrão seguro
  let savedLayout = savedLayoutProp
  if (savedLayout && (!savedLayout.ROOT || typeof savedLayout.ROOT !== 'object')) {
    console.warn('[Editor] Layout carregado não tem ROOT válido, usando layout padrão seguro')
    savedLayout = createSafeDefaultLayout()
  }
  
  // Debug: verificar resolver e layout antes da validação
  console.log('[Editor] Resolver disponível:', Object.keys(templateResolver).length, 'componentes')
  console.log('[Editor] Componentes no resolver:', Object.keys(templateResolver))
  console.log('[Editor] Layout antes da validação:', {
    hasLayout: !!savedLayout,
    hasRoot: !!savedLayout?.ROOT,
    totalNodes: Object.keys(savedLayout || {}).length,
    rootNodes: (savedLayout?.ROOT as any)?.nodes?.length || 0,
    firstNodeType: (savedLayout?.ROOT as any)?.nodes?.[0] ? (savedLayout as any)?.[(savedLayout?.ROOT as any)?.nodes?.[0]]?.type?.resolvedName : null
  })
  
  // Validar e limpar o layout antes de passar para o Frame
  // Remove componentes inválidos que não existem no resolver
  // SEMPRE retorna um layout válido (cria padrão se necessário)
  let finalLayout: Record<string, unknown>
  
  if (savedLayout) {
    // Tentar validar, mas se remover tudo, usar o original
    const cleaned = validateAndCleanLayout(savedLayout, templateResolver)
    
    // Se a validação removeu muitos nós, pode ser que o resolver não tenha os componentes
    // Nesse caso, usar o layout original e deixar o Craft.js lidar com erros
    const originalNodeCount = Object.keys(savedLayout).length
    const cleanedNodeCount = Object.keys(cleaned).length
    const removedPercentage = ((originalNodeCount - cleanedNodeCount) / originalNodeCount) * 100
    
    if (removedPercentage > 50) {
      console.warn(`[Editor] Validação removeu ${removedPercentage.toFixed(0)}% dos nós. Usando layout original.`)
      finalLayout = savedLayout
    } else {
      finalLayout = cleaned
    }
  } else {
    finalLayout = createSafeDefaultLayout()
  }
  
  // Debug: verificar se o layout tem conteúdo após validação
  console.log('[Editor] Layout final:', {
    hasRoot: !!finalLayout?.ROOT,
    rootNodes: (finalLayout?.ROOT as any)?.nodes?.length || 0,
    totalNodes: Object.keys(finalLayout || {}).length,
    rootNodeIds: (finalLayout?.ROOT as any)?.nodes || []
  })
  
  // Converter layout para JSON string para usar na prop data do Frame
  // O Craft só deve receber data quando existir layout válido
  const layoutJson = Object.keys(finalLayout).length > 0 
    ? JSON.stringify(finalLayout) 
    : null
  
  console.log('[Editor] Layout JSON pronto:', {
    hasJson: !!layoutJson,
    jsonLength: layoutJson?.length || 0
  })
  const { previewMode } = usePreviewMode()
  const frameRef = useRef<HTMLDivElement>(null)
  const { enabled } = useEditor((state: any) => ({
    enabled: state.options.enabled
  }))

  // Adicionar estilos para permitir scroll dentro do DeviceFrameset
  useEffect(() => {
    const style = document.createElement('style')
    style.id = 'device-frameset-scroll-fix'
    style.textContent = `
      /* Permitir scroll dentro do DeviceFrameset */
      .marvel-device {
        overflow: visible !important;
      }
      
      .marvel-device .screen {
        overflow-y: auto !important;
        overflow-x: hidden !important;
        height: 100% !important;
      }
      
      /* Garantir que o conteúdo interno possa fazer scroll */
      .marvel-device .screen > * {
        min-height: 100% !important;
      }
    `
    if (!document.getElementById('device-frameset-scroll-fix')) {
      document.head.appendChild(style)
    }
    return () => {
      const existingStyle = document.getElementById('device-frameset-scroll-fix')
      if (existingStyle) {
        existingStyle.remove()
      }
    }
  }, [])
  
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

  // Mapear preview mode para dispositivos da biblioteca
  const getDeviceConfig = () => {
    switch (previewMode) {
      case 'tablet':
        return { device: 'iPad Mini' as const, color: 'silver' as const }
      case 'desktop':
        return { device: 'MacBook Pro' as const }
      default:
        return { device: 'MacBook Pro' as const }
    }
  }

  const deviceConfig = getDeviceConfig()

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
          {layoutJson ? (
            <DeviceFrameset {...deviceConfig}>
              <div 
                ref={frameRef}
                className="w-full"
                style={{ 
                  fontFamily: 'var(--font-body, "Montserrat", system-ui, sans-serif)',
                  backgroundColor: 'hsl(var(--background, 0 0% 100%))',
                  color: 'hsl(var(--foreground, 0 0% 12%))',
                  isolation: 'isolate', // Isolar do CSS do admin
                  minHeight: '100vh', // Garantir altura mínima para scroll
                }}
              >
                <RestrictedFrame data={layoutJson} templateId={selectedTemplate} />
              </div>
            </DeviceFrameset>
          ) : (
            <div className="p-8 text-center text-gray-500">
              <p>Selecione um template para começar</p>
            </div>
          )}
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
