'use client'

import { useEditor } from '@craftjs/core'
import React from 'react'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useConfirm } from '@/lib/hooks/use-confirm'
import {
  Hero,
  Banner,
  ProductGrid,
  Newsletter,
  Testimonials,
  FAQ,
  FooterSection
} from '@/components/store'

// Mapeamento de componentes para suas configurações
const componentMap: Record<string, React.ComponentType<any> & {
  craft?: {
    related?: {
      settings?: React.ComponentType
    }
  }
}> = {
  Hero,
  Banner,
  ProductGrid,
  Newsletter,
  Testimonials,
  FAQ,
  FooterSection
}

export function EditorSettingsPanel() {
  const { confirm, ConfirmDialog } = useConfirm()
  const { selected, actions, query } = useEditor((state, query) => {
    const [currentNodeId] = state.events.selected

    if (!currentNodeId) {
      return { selected: null }
    }

    const node = state.nodes[currentNodeId]
    
    // Obter o componente do resolver através do tipo
    let SettingsComponent: React.ComponentType<any> | null = null
    
    try {
      // Tentar acessar node.related.settings primeiro (Craft.js pode expor isso)
      if (node.related?.settings) {
        SettingsComponent = node.related.settings as React.ComponentType<any>
      } else {
        // Obter o componente do resolver
        const resolver = query.getOptions().resolver as Record<string, React.ComponentType<any> & {
          craft?: {
            displayName?: string
            related?: {
              settings?: React.ComponentType
            }
          }
        }>
        
        const displayName = node.data.displayName
        const ComponentType = node.data.type
        
        // Tentar pelo nome do componente no resolver (chave do objeto resolver)
        if (ComponentType && typeof ComponentType === 'function') {
          const componentName = ComponentType.name
          if (componentName && resolver[componentName]) {
            const Component = resolver[componentName]
            if (Component?.craft?.related?.settings) {
              SettingsComponent = Component.craft.related.settings
            }
          }
        }
        
        // Se não encontrou, tentar pelo displayName
        if (!SettingsComponent && displayName && resolver) {
          for (const [key, Component] of Object.entries(resolver)) {
            if (Component?.craft?.related?.settings) {
              // Verificar se o displayName corresponde
              if (Component.craft.displayName === displayName || key === displayName) {
                SettingsComponent = Component.craft.related.settings
                break
              }
            }
          }
        }
        
        // Se ainda não encontrou, tentar pelo nosso mapeamento local
        if (!SettingsComponent && ComponentType && typeof ComponentType === 'function') {
          const componentName = ComponentType.name
          if (componentName && componentMap[componentName]) {
            const MappedComponent = componentMap[componentName]
            if (MappedComponent?.craft?.related?.settings) {
              SettingsComponent = MappedComponent.craft.related.settings
            }
          }
        }
      }
    } catch (error) {
      // Silenciosamente ignorar erros
    }

    return {
      selected: {
        id: currentNodeId,
        name: node.data.displayName || node.data.name || 'Componente',
        settings: SettingsComponent,
        isDeletable: query.node(currentNodeId).isDeletable()
      }
    }
  })

  const handleDelete = async () => {
    if (!selected?.id || !selected.isDeletable) return

    const confirmed = await confirm({
      title: 'Remover componente',
      description: `Tem certeza que deseja remover o componente "${selected.name}"?`,
      confirmText: 'Remover',
      cancelText: 'Cancelar',
      variant: 'destructive'
    })

    if (!confirmed) return

    try {
      // Remover o componente
      actions.delete(selected.id)
      toast.success('Componente removido com sucesso!')
    } catch (error) {
      console.error('Erro ao remover componente:', error)
      toast.error('Erro ao remover componente. Tente novamente.')
    }
  }

  // Não renderizar se nenhum componente estiver selecionado
  if (!selected) {
    return <ConfirmDialog />
  }

  return (
    <>
      <ConfirmDialog />
      <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Configurações</h2>
              <p className="text-sm text-gray-500 mt-1">
                {selected.name}
              </p>
            </div>
            {selected.isDeletable && (
              <button
                onClick={handleDelete}
                className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                title="Remover componente"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        <div className="p-4">
          {selected.settings ? (
            React.createElement(selected.settings)
          ) : (
            <div className="text-sm text-gray-400 text-center py-8">
              Este componente não possui configurações
            </div>
          )}
        </div>
      </div>
    </>
  )
}

