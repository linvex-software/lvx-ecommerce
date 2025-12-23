'use client'

// Forçar renderização dinâmica para evitar pré-renderização estática
export const dynamic = 'force-dynamic'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Editor, useEditor } from '@craftjs/core'
import { useAuthStore } from '@/store/auth-store'
import { apiClient } from '@/lib/api-client'
import { EditorSettingsPanel } from '@/components/editor/editor-settings-panel'
import { EditorTopbar } from '@/components/editor/editor-topbar'
import { TemplateSelector } from '@/components/editor/template-selector'
import { IsolatedPreviewFrame } from '@/components/editor/isolated-preview-frame'
import { PreviewProvider } from '@/components/editor/preview-context'
import { loadTemplateLayout, loadTemplateConfig, loadTemplateComponents } from '@/lib/templates/template-loader'
import { validateAndCleanLayout, createSafeDefaultLayout } from '@/lib/templates/layout-validator'
import { EditorCartProvider } from '@/components/editor/editor-cart-provider'
import { Spinner } from '@/components/ui/ios-spinner'

// Componente que escuta mensagens do iframe para selecionar nodes e fornecer token
function NodeSelectorListener() {
  const { actions, query } = useEditor((state) => ({
    nodes: state.nodes
  }))
  const accessToken = useAuthStore((state) => state.accessToken)
  
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Verificar origem para segurança
      const isLocalhost = event.origin.includes('localhost') || event.origin.includes('127.0.0.1')
      const isWebOrigin = event.origin.includes('web') || isLocalhost
      
      if (!isWebOrigin) return
      
      // Responder a solicitações de token
      if (event.data?.type === 'GET_AUTH_TOKEN') {
        console.log('[NodeSelectorListener] Enviando token para iframe');
        event.source?.postMessage({
          type: 'GET_AUTH_TOKEN_RESPONSE',
          token: accessToken
        }, { targetOrigin: event.origin });
        return;
      }
      
      if (event.data.action === 'SELECT_NODE' && event.data.nodeId) {
        const nodeId = event.data.nodeId
        console.log('[NodeSelectorListener] Recebida mensagem para selecionar node:', nodeId)
        
        // Função para tentar selecionar o node com retry
        const trySelectNode = (attempt = 0) => {
          try {
            // Usar query para acessar os nodes
            if (!query || !actions) {
              if (attempt < 5) {
                setTimeout(() => trySelectNode(attempt + 1), 200)
                return
              }
              console.warn('[NodeSelectorListener] Query ou actions não disponíveis')
              return
            }
            
            // Primeiro, tentar selecionar pelo nodeId recebido
            try {
              const node = query.node(nodeId).get()
              if (node && actions.selectNode) {
                console.log('[NodeSelectorListener] Node encontrado pelo ID, selecionando:', nodeId)
                actions.selectNode(nodeId)
                return true
              }
            } catch (e) {
              // Node não encontrado pelo ID, continuar procurando
            }
            
            // Se não encontrou pelo ID, tentar encontrar pelo tipo HeroBanner
            // Buscar nos nodes do ROOT
            try {
              const rootNode = query.node('ROOT').get()
              if (rootNode && rootNode.data && rootNode.data.nodes) {
                for (const childId of rootNode.data.nodes) {
                  try {
                    const childNode = query.node(childId).get()
                    if (childNode) {
                      const typeName = typeof childNode.data?.type === 'object' && childNode.data?.type !== null && 'resolvedName' in childNode.data.type
                        ? (childNode.data.type as { resolvedName?: string }).resolvedName
                        : undefined
                      const displayName = childNode.data?.displayName
                      
                      if (typeName === 'HeroBanner' || displayName === 'Hero Banner') {
                        if (actions.selectNode) {
                          console.log('[NodeSelectorListener] Node HeroBanner encontrado pelo tipo, selecionando:', childId)
                          actions.selectNode(childId)
                          return true
                        }
                      }
                    }
                  } catch (e) {
                    // Continuar procurando
                  }
                }
              }
            } catch (e) {
              // Erro ao acessar ROOT
            }
            
            // Se não encontrou e ainda há tentativas, tentar novamente
            if (attempt < 5) {
              console.log(`[NodeSelectorListener] Tentativa ${attempt + 1}: Node não encontrado, tentando novamente em 200ms...`)
              setTimeout(() => trySelectNode(attempt + 1), 200)
              return false
            }
            
            console.warn('[NodeSelectorListener] Não foi possível encontrar o node HeroBanner após 5 tentativas')
            return false
          } catch (error) {
            console.error('[NodeSelectorListener] Erro ao selecionar node:', error)
            if (attempt < 5) {
              setTimeout(() => trySelectNode(attempt + 1), 200)
            }
            return false
          }
        }
        
        // Iniciar tentativa após um pequeno delay
        setTimeout(() => trySelectNode(), 300)
      }
    }
    
    window.addEventListener('message', handleMessage)
    
    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [actions, query, accessToken])
  
  return null
}

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

        // Carregar layout do template ou layout personalizado salvo
        // IMPORTANTE: Não carregar layout padrão primeiro para evitar flash do template padrão
        if (!user?.storeId) {
          // Sem storeId, usar layout padrão
          const defaultLayout = await loadTemplateLayout(selectedTemplate)
          setSavedLayout(defaultLayout)
          setIsLoading(false)
          return
        }

        // Tentar carregar layout salvo primeiro
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
              setIsLoading(false)
              return
            }
          }
          
          // Se não houver layout salvo válido, carregar layout padrão
          console.log('[Editor] Sem layout salvo válido, carregando layout padrão do template')
          const defaultLayout = await loadTemplateLayout(selectedTemplate)
          setSavedLayout(defaultLayout)
        } catch (error) {
          // Se houver erro ao carregar layout salvo, usar layout padrão
          console.log('[Editor] Erro ao carregar layout salvo, usando padrão:', error)
          try {
            const defaultLayout = await loadTemplateLayout(selectedTemplate)
            setSavedLayout(defaultLayout)
          } catch (layoutError) {
            console.error('[Editor] Erro ao carregar layout padrão:', layoutError)
            setSavedLayout(null)
          }
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

  // Renderizar estrutura mesmo durante carregamento - o preview terá seu próprio loading
  // Se não tiver dados ainda, usar valores padrão para evitar erro
  const displayLayout = savedLayout || null
  const displayResolver = Object.keys(templateResolver).length > 0 ? templateResolver : {}

  return (
    <PreviewProvider>
      <div className="h-full flex flex-col overflow-hidden">
        <Editor
          resolver={displayResolver}
          enabled={!isPreview}
        >
          <EditorContentInner 
            savedLayout={displayLayout} 
            isPreview={isPreview}
            onTemplateSelect={handleTemplateSelect}
            selectedTemplate={selectedTemplate}
            templateResolver={displayResolver}
          />
        </Editor>
      </div>
    </PreviewProvider>
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
  // Sempre renderizar estrutura - o preview terá seu próprio loading
  // Se não tiver layout ainda, o preview mostrará loading
  // Se não tiver layout ainda, usar null - o preview mostrará loading
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
  // Se não tiver layout ainda, passar null - o preview mostrará loading
  const layoutJson = finalLayout && Object.keys(finalLayout).length > 0 
    ? JSON.stringify(finalLayout) 
    : null
  
  console.log('[Editor] Layout JSON pronto:', {
    hasJson: !!layoutJson,
    jsonLength: layoutJson?.length || 0
  })

  return (
    <>
      <EditorTopbar isPreview={isPreview} />
      <NodeSelectorListener />
      <div className="flex-1 flex overflow-hidden bg-background">
        {!isPreview && (
          <div className="w-64 bg-surface border-r border-border h-full flex flex-col">
            <TemplateSelector onTemplateSelect={onTemplateSelect} selectedTemplate={selectedTemplate} />
          </div>
        )}
        <div className="flex-1 overflow-hidden bg-surface-2">
          <IsolatedPreviewFrame
            templateId={selectedTemplate}
            layoutJson={layoutJson}
          />
        </div>
      </div>
    </>
  )
}

export default function EditorPage() {
  return (
    <Suspense fallback={null}>
      <EditorContent />
    </Suspense>
  )
}
