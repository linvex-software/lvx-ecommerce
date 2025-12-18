'use client'

import React from 'react'
import { useEditor } from '@craftjs/core'
import { Button } from '@white-label/ui'
import { Trash2 } from 'lucide-react'

export function CraftSettingsPanel() {
  const { selected, actions, query } = useEditor((state, query) => {
    const [currentNodeId] = state.events.selected

    let selected

    if (currentNodeId) {
      const node = state.nodes[currentNodeId]
      selected = {
        id: currentNodeId,
        name: node.data.displayName || node.data.name || 'Componente',
        settings: node.related?.settings,
        isDeletable: query.node(currentNodeId).isDeletable(),
      }
    }

    return { selected }
  })

  if (!selected) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <p className="text-sm">Selecione um componente para editar</p>
      </div>
    )
  }

  return (
    <div>
      <div className="px-4 py-3 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">CUSTOMIZE</h3>
            <p className="text-xs text-gray-500 mt-0.5">{selected.name}</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4 overflow-y-auto">
        {selected.settings && React.createElement(selected.settings)}

        {selected.isDeletable && (
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-4"
            onClick={() => {
              actions.delete(selected.id)
            }}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Deletar Componente
          </Button>
        )}
      </div>
    </div>
  )
}

