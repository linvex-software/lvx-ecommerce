'use client'

import { useEditor } from '@craftjs/core'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/auth-store'
import { apiClient } from '@/lib/api-client'
import { optimizeLayout, getOptimizationStats } from '@/lib/utils/layout-optimizer'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Menu, Undo2, Redo2, Eye, ChevronDown, Settings, ArrowLeft, Moon, Sun } from 'lucide-react'
import { PreviewViewportControls } from './preview-viewport-controls'
import { useTheme } from '@/components/providers/theme-provider'
import Link from 'next/link'

interface EditorTopbarProps {
  isPreview: boolean
  useEditorContext?: boolean // Opcional: se false, não tenta usar o editor
  customActionButton?: {
    label: string
    onClick: () => void
    disabled?: boolean
    isLoading?: boolean
  } // Opcional: botão de ação customizado (ex: "Salvar Menu")
}

// Componente interno que usa o editor (só renderizado quando useEditorContext é true)
function EditorTopbarWithEditor({ isPreview, customActionButton }: { isPreview: boolean; customActionButton?: EditorTopbarProps['customActionButton'] }) {
  const { query, enabled, actions } = useEditor((state) => ({
    enabled: state.options.enabled,
    nodes: state.nodes,
  }))
  
  return <EditorTopbarContent 
    isPreview={isPreview} 
    editorQuery={query} 
    editorEnabled={enabled} 
    editorActions={actions}
    customActionButton={customActionButton}
  />
}

// Componente interno sem editor (usado quando useEditorContext é false)
function EditorTopbarWithoutEditor({ isPreview, customActionButton }: { isPreview: boolean; customActionButton?: EditorTopbarProps['customActionButton'] }) {
  return <EditorTopbarContent 
    isPreview={isPreview} 
    editorQuery={null} 
    editorEnabled={false} 
    editorActions={null}
    customActionButton={customActionButton}
  />
}

// Componente principal que decide qual versão renderizar
export function EditorTopbar({ isPreview, useEditorContext = true, customActionButton }: EditorTopbarProps) {
  if (useEditorContext) {
    return <EditorTopbarWithEditor isPreview={isPreview} customActionButton={customActionButton} />
  }
  return <EditorTopbarWithoutEditor isPreview={isPreview} customActionButton={customActionButton} />
}

// Componente de conteúdo compartilhado
function EditorTopbarContent({ 
  isPreview, 
  editorQuery, 
  editorEnabled, 
  editorActions,
  customActionButton
}: { 
  isPreview: boolean
  editorQuery: any
  editorEnabled: boolean
  editorActions: any
  customActionButton?: EditorTopbarProps['customActionButton']
}) {
  const router = useRouter()
  const pathname = usePathname()
  const user = useAuthStore((state) => state.user)
  const [isSaving, setIsSaving] = useState(false)
  const [mounted, setMounted] = useState(false)
  const isMenuPage = pathname?.includes('/editor/menu') || false
  const isPagesPage = pathname === '/editor/pages' // Exatamente /editor/pages (não inclui subpáginas)
  
  // Usar useTheme de forma segura (pode falhar durante SSR)
  let theme: 'light' | 'dark' = 'light'
  let toggleTheme: () => void = () => {}
  
  try {
    const themeHook = useTheme()
    theme = themeHook.theme
    toggleTheme = themeHook.toggleTheme
  } catch (error) {
    // Se não estiver no contexto do ThemeProvider (durante SSR ou build), usar valores padrão
    // O erro será ignorado e os valores padrão serão usados
  }
  
  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSave = async () => {
    if (!user?.storeId) return

    setIsSaving(true)
    try {
      // O editor está dentro de um iframe, então precisamos solicitar a serialização do iframe
      // Primeiro, tentar solicitar serialização do iframe
      let layoutJson: Record<string, unknown> | null = null
      
      if (typeof window !== 'undefined' && (window as any).__requestLayoutSerialize) {
        console.log('[EditorTopbar] Solicitando serialização do iframe...')
        
        // Criar uma promise para aguardar a resposta do iframe
        const serializedPromise = new Promise<string>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Timeout aguardando serialização do iframe'))
          }, 5000)
          
          const handleMessage = (event: MessageEvent) => {
            if (event.data.action === 'LAYOUT_SERIALIZED' && event.data.layout) {
              clearTimeout(timeout)
              window.removeEventListener('message', handleMessage)
              resolve(event.data.layout)
            }
          }
          
          window.addEventListener('message', handleMessage)
          ;(window as any).__requestLayoutSerialize()
        })
        
        try {
          const serialized = await serializedPromise
          layoutJson = JSON.parse(serialized)
          console.log('[EditorTopbar] Layout recebido do iframe:', {
            nodeCount: layoutJson ? Object.keys(layoutJson).length : 0,
            hasRoot: !!layoutJson?.ROOT,
          })
        } catch (error) {
          console.warn('[EditorTopbar] Erro ao obter layout do iframe, tentando local:', error)
        }
      }
      
      // Fallback: tentar serializar do editor local (pode estar vazio se o editor estiver no iframe)
      if (!layoutJson || Object.keys(layoutJson).length === 0) {
        if (!editorQuery) {
          throw new Error('Editor não disponível')
        }
        
        console.log('[EditorTopbar] Tentando serializar do editor local...')
        await new Promise(resolve => setTimeout(resolve, 300))
        
        try {
          const serializedNodes = editorQuery.getSerializedNodes()
          layoutJson = serializedNodes as Record<string, unknown>
          console.log('[EditorTopbar] Usando getSerializedNodes(), nodeCount:', Object.keys(layoutJson).length)
        } catch (error) {
          const serialized = editorQuery.serialize()
          layoutJson = JSON.parse(serialized)
        }
      }
      
      if (!layoutJson || Object.keys(layoutJson).length === 0) {
        throw new Error('Não foi possível serializar o layout. O editor pode estar vazio ou não estar carregado.')
      }
      
      console.log('[EditorTopbar] Serializado antes de salvar:', {
        serializedLength: JSON.stringify(layoutJson).length,
        nodeCount: Object.keys(layoutJson).length,
        hasRoot: !!layoutJson.ROOT,
        rootNodes: (layoutJson.ROOT as any)?.nodes?.length || 0,
      })

      // Debug: Verificar se há EditableText com conteúdo no layout
      const editableTextNodes: any[] = []
      const findEditableTexts = (nodeId: string, node: any, visited = new Set<string>()) => {
        if (visited.has(nodeId)) return
        visited.add(nodeId)
        
        if (node?.type?.resolvedName === 'EditableText') {
          editableTextNodes.push({
            nodeId,
            content: node.props?.content || '',
            hasContent: !!node.props?.content
          })
        }
        
        if (node?.nodes) {
          for (const childId of node.nodes) {
            const childNode = layoutJson[childId]
            if (childNode) {
              findEditableTexts(childId, childNode, visited)
            }
          }
        }
      }
      
      if (layoutJson.ROOT) {
        findEditableTexts('ROOT', layoutJson.ROOT)
      }
      
      console.log('[EditorTopbar] Salvando layout:', {
        totalNodes: Object.keys(layoutJson).length,
        rootNodes: (layoutJson.ROOT as any)?.nodes?.length || 0,
        editableTextCount: editableTextNodes.length,
        editableTextsWithContent: editableTextNodes.filter(n => n.hasContent).length,
        editableTexts: editableTextNodes.slice(0, 5) // Primeiros 5 para debug
      })

      // Otimizar layout antes de salvar (remove campos desnecessários)
      const optimizedLayout = optimizeLayout(layoutJson) as Record<string, unknown>
      
      // Log de estatísticas de otimização
      const stats = getOptimizationStats(layoutJson, optimizedLayout)
      if (stats.reduction > 0) {
        console.log('[EditorTopbar] Layout otimizado:', {
          originalSize: `${(stats.originalSize / 1024).toFixed(2)} KB`,
          optimizedSize: `${(stats.optimizedSize / 1024).toFixed(2)} KB`,
          reduction: `${(stats.reduction / 1024).toFixed(2)} KB`,
          reductionPercent: `${stats.reductionPercent}%`
        })
      }

      const response = await apiClient.post<{
        success: boolean
        layout_json: Record<string, unknown>
        updated_at: string
      }>('/editor/layout', {
        layout_json: optimizedLayout
      })

      console.log('[EditorTopbar] Layout salvo com sucesso:', {
        success: response.data.success,
        updated_at: response.data.updated_at,
        savedNodeCount: Object.keys(response.data.layout_json || {}).length
      })
      toast.success('Layout salvo com sucesso!')
      
      // Notificar a página principal para recarregar (se estiver aberta)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('layout-saved'))
      }
    } catch (error: unknown) {
      console.error('Erro ao salvar layout:', error)
      
      if (error && typeof error === 'object' && 'response' in error) {
        const apiError = error as { response?: { data?: { error?: string } } }
        const errorMessage = apiError.response?.data?.error || 'Erro desconhecido'
        toast.error('Erro ao salvar layout', {
          description: errorMessage
        })
      } else {
        toast.error('Erro ao salvar layout')
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handlePreview = () => {
    if (isPreview) {
      router.push('/editor')
    } else {
      router.push('/editor?preview=true')
    }
  }

  const handleToggleEditor = () => {
    // Toggle editor enabled state
    // This is handled by Craft.js internally
  }

  return (
    <div className="h-14 bg-background border-b border-border flex items-center justify-between px-4">
      {/* Left Section */}
      <div className="flex items-center gap-3">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push('/')}
            className="p-1.5 hover:bg-hover rounded transition-colors"
            title="Voltar"
          >
            <ArrowLeft className="w-5 h-5 text-text-primary" />
          </button>
          <div className="text-lg font-semibold text-text-primary">Editando: {user?.store?.name || 'Minha Loja'}</div>
        </div>
        
        
      </div>

      {/* Center Section - Preview Viewport Controls - apenas quando editor está disponível */}
      {editorQuery && <PreviewViewportControls />}

      {/* Right Section */}
      <div className="flex items-center gap-2">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 text-text-secondary hover:bg-hover rounded transition-colors"
          aria-label={theme === 'dark' ? 'Alternar para modo claro' : 'Alternar para modo escuro'}
          title={theme === 'dark' ? 'Alternar para modo claro' : 'Alternar para modo escuro'}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4" />
          ) : (
            <Moon className="w-4 h-4" />
          )}
        </button>
        
        {/* Preferências */}
        <Link
          href="/editor/preferences"
          className="p-2 text-text-secondary hover:bg-hover rounded transition-colors"
          title="Preferências"
        >
          <Settings className="w-4 h-4" />
        </Link>
        
        {/* Undo/Redo */}
        <button className="p-2 text-text-secondary hover:bg-hover rounded transition-colors">
          <Undo2 className="w-4 h-4" />
        </button>
        <button className="p-2 text-text-secondary hover:bg-hover rounded transition-colors">
          <Redo2 className="w-4 h-4" />
        </button>
        
        {/* Preview Eye */}
        <button
          onClick={handlePreview}
          className="p-2 text-text-secondary hover:bg-hover rounded transition-colors"
        >
          <Eye className="w-4 h-4" />
        </button>
        
        {/* Custom Action Button (ex: Salvar Menu) */}
        {!isPreview && customActionButton && (
          <div className="relative">
            <button
              onClick={customActionButton.onClick}
              disabled={customActionButton.disabled || customActionButton.isLoading}
              className="px-4 py-2 text-sm bg-[#7c3aed] text-white rounded-md hover:bg-[#6d28d9] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
            >
              {customActionButton.isLoading ? 'Salvando...' : customActionButton.label}
            </button>
          </div>
        )}

        {/* Publish Button - apenas na homepage, não no menu ou pages */}
        {!isPreview && !customActionButton && !isMenuPage && !isPagesPage && editorQuery && (
          <div className="relative">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 text-sm bg-[#7c3aed] text-white rounded-md hover:bg-[#6d28d9] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
            >
              {isSaving ? 'Salvando...' : 'Publicar'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

