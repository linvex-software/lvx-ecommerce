'use client'

import React, { useState } from 'react'
import { useEditor } from '@craftjs/core'
import { Eye, EyeOff, ChevronRight, ChevronDown, Layers } from 'lucide-react'

interface LayerNode {
  id: string
  name: string
  expanded: boolean
  visible: boolean
  children: LayerNode[]
}

export function CraftLayersPanel() {
  const { actions, query } = useEditor((state, query) => ({
    nodes: state.nodes,
  }))

  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())

  const toggleExpand = (nodeId: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev)
      if (next.has(nodeId)) {
        next.delete(nodeId)
      } else {
        next.add(nodeId)
      }
      return next
    })
  }

  const buildLayerTree = (nodeId: string): LayerNode[] => {
    try {
      const node = query.node(nodeId).get()
      if (!node) return []

      const displayName = node.data.displayName || node.data.name || nodeId
      const isExpanded = expandedNodes.has(nodeId)
      const isVisible = !node.data.props?.hidden

      const children: LayerNode[] = []
      if (node.data.nodes && Array.isArray(node.data.nodes) && node.data.nodes.length > 0) {
        node.data.nodes.forEach((childId: string) => {
          children.push(...buildLayerTree(childId))
        })
      }

      return [{
        id: nodeId,
        name: displayName,
        expanded: isExpanded,
        visible: isVisible,
        children,
      }]
    } catch (error) {
      return []
    }
  }

  const renderLayer = (layer: LayerNode, depth = 0) => {
    const hasChildren = layer.children.length > 0

    return (
      <div key={layer.id}>
        <div
          className="flex items-center gap-1 px-2 py-1.5 hover:bg-hover cursor-pointer group"
          style={{ paddingLeft: `${8 + depth * 16}px` }}
          onClick={() => {
            try {
              actions.selectNode(layer.id)
            } catch (error) {
              console.error('Erro ao selecionar nó:', error)
            }
          }}
        >
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleExpand(layer.id)
              }}
              className="p-0.5 hover:bg-gray-200 rounded"
            >
              {layer.expanded ? (
                <ChevronDown className="w-3 h-3 text-gray-500" />
              ) : (
                <ChevronRight className="w-3 h-3 text-gray-500" />
              )}
            </button>
          ) : (
            <div className="w-4" />
          )}
          
          <button
            onClick={(e) => {
              e.stopPropagation()
              try {
                const node = query.node(layer.id).get()
                if (node) {
                  actions.setProp(layer.id, (props: any) => {
                    props.hidden = !props.hidden
                  })
                }
              } catch (error) {
                console.error('Erro ao alternar visibilidade:', error)
              }
            }}
            className="p-0.5 hover:bg-gray-200 rounded opacity-0 group-hover:opacity-100 transition-opacity"
          >
            {layer.visible ? (
              <Eye className="w-3.5 h-3.5 text-gray-500" />
            ) : (
              <EyeOff className="w-3.5 h-3.5 text-gray-500" />
            )}
          </button>
          
          <span className="text-sm text-gray-700 flex-1 truncate">{layer.name}</span>
        </div>
        
        {hasChildren && layer.expanded && (
          <div>
            {layer.children.map(child => renderLayer(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  let layers: LayerNode[] = []
  try {
    const rootNode = query.node('ROOT').get()
    if (rootNode?.data?.nodes && Array.isArray(rootNode.data.nodes)) {
      layers = rootNode.data.nodes.flatMap((nodeId: string) => buildLayerTree(nodeId))
    }
  } catch (error) {
    console.error('Erro ao construir árvore de camadas:', error)
  }

  return (
    <div className="border-b border-gray-200">
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-gray-600" />
          <h3 className="text-sm font-semibold text-gray-900">LAYERS</h3>
        </div>
      </div>
      
      <div className="bg-white max-h-[400px] overflow-y-auto">
        {layers.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-gray-500">
            Nenhum componente adicionado
          </div>
        ) : (
          <div>
            {layers.map(layer => renderLayer(layer))}
          </div>
        )}
      </div>
    </div>
  )
}

