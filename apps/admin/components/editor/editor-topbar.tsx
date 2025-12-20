'use client'

import { useEditor } from '@craftjs/core'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/auth-store'
import { apiClient } from '@/lib/api-client'
import { optimizeLayout, getOptimizationStats } from '@/lib/utils/layout-optimizer'
import { useState } from 'react'
import { toast } from 'sonner'
import { Menu, Undo2, Redo2, Eye, ChevronDown, Settings, ArrowLeft } from 'lucide-react'
import { PreviewViewportControls } from './preview-viewport-controls'
import Link from 'next/link'

interface EditorTopbarProps {
  isPreview: boolean
}

export function EditorTopbar({ isPreview }: EditorTopbarProps) {
  const { query, enabled, actions } = useEditor((state) => ({
    enabled: state.options.enabled,
    nodes: state.nodes, // Incluir nodes para garantir que temos acesso ao estado
  }))
  const router = useRouter()
  const pathname = usePathname()
  const user = useAuthStore((state) => state.user)
  const [isSaving, setIsSaving] = useState(false)
  const isMenuPage = pathname?.includes('/editor/menu') || false

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
        console.log('[EditorTopbar] Tentando serializar do editor local...')
        await new Promise(resolve => setTimeout(resolve, 300))
        
        try {
          const serializedNodes = query.getSerializedNodes()
          layoutJson = serializedNodes as Record<string, unknown>
          console.log('[EditorTopbar] Usando getSerializedNodes(), nodeCount:', Object.keys(layoutJson).length)
        } catch (error) {
          const serialized = query.serialize()
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
    <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4">
      {/* Left Section */}
      <div className="flex items-center gap-3">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push('/')}
            className="p-1.5 hover:bg-gray-100 rounded transition-colors"
            title="Voltar"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div className="text-lg font-semibold text-gray-900">Editando: {user?.store?.name || 'Minha Loja'}</div>
        </div>
        
        
      </div>

      {/* Center Section - Preview Viewport Controls */}
      <PreviewViewportControls />

      {/* Right Section */}
      <div className="flex items-center gap-2">
        {/* Preferências */}
        <Link
          href="/editor/preferences"
          className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
          title="Preferências"
        >
          <Settings className="w-4 h-4" />
        </Link>
        
        {/* Undo/Redo */}
        <button className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors">
          <Undo2 className="w-4 h-4" />
        </button>
        <button className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors">
          <Redo2 className="w-4 h-4" />
        </button>
        
        {/* Preview Eye */}
        <button
          onClick={handlePreview}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
        >
          <Eye className="w-4 h-4" />
        </button>
        
        {/* Publish Button - apenas na homepage, não no menu */}
        {!isPreview && !isMenuPage && (
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

