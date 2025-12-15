'use client'

import { useEditor } from '@craftjs/core'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth-store'
import { apiClient } from '@/lib/api-client'
import { useState } from 'react'
import { toast } from 'sonner'
import { Menu, Monitor, Tablet, Undo2, Redo2, Eye, ChevronDown, Settings, ArrowLeft } from 'lucide-react'
import { usePreviewMode } from './preview-context'
import Link from 'next/link'

interface EditorTopbarProps {
  isPreview: boolean
}

export function EditorTopbar({ isPreview }: EditorTopbarProps) {
  const { query, enabled } = useEditor((state) => ({
    enabled: state.options.enabled
  }))
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const [isSaving, setIsSaving] = useState(false)
  const { previewMode, setPreviewMode } = usePreviewMode()

  const handleSave = async () => {
    if (!user?.storeId) return

    setIsSaving(true)
    try {
      const serialized = query.serialize()
      const layoutJson = JSON.parse(serialized)

      const response = await apiClient.post<{
        success: boolean
        layout_json: Record<string, unknown>
        updated_at: string
      }>('/editor/layout', {
        layout_json: layoutJson
      })

      console.log('[EditorTopbar] Layout salvo com sucesso:', response.data)
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

      {/* Center Section - Preview Icons */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setPreviewMode('desktop')}
          className={`p-2 rounded transition-colors ${
            previewMode === 'desktop' 
              ? 'bg-[#7c3aed] text-white' 
              : 'text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Monitor className="w-4 h-4" />
        </button>
        <button
          onClick={() => setPreviewMode('tablet')}
          className={`p-2 rounded transition-colors ${
            previewMode === 'tablet' 
              ? 'bg-[#7c3aed] text-white' 
              : 'text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Tablet className="w-4 h-4" />
        </button>
      </div>

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
        
        {/* Publish Button */}
        {!isPreview && (
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

