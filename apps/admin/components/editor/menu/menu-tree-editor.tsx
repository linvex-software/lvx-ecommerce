'use client'

import { useState } from 'react'
import { GripVertical, Plus, Trash2, ChevronRight, ChevronDown, Link, Folder, FileText, Image, List } from 'lucide-react'
import { Button } from '@white-label/ui'
import type { NavbarItem } from '@/lib/types/navbar'

interface MenuTreeEditorProps {
  items: NavbarItem[]
  selectedItem: NavbarItem | null
  onSelectItem: (item: NavbarItem | null) => void
  onAddItem: (parentId?: string | null) => void
  onUpdateItem: (item: NavbarItem) => void
  onDeleteItem: (itemId: string) => void
  onItemsChange: (items: NavbarItem[]) => void
}

const getItemIcon = (type: NavbarItem['type']) => {
  switch (type) {
    case 'link':
    case 'internal':
    case 'external':
      return <Link className="h-4 w-4" />
    case 'category':
      return <Folder className="h-4 w-4" />
    case 'page':
      return <FileText className="h-4 w-4" />
    case 'custom-block':
      return <Image className="h-4 w-4" />
    case 'dynamic-list':
      return <List className="h-4 w-4" />
    default:
      return <Folder className="h-4 w-4" />
  }
}

const getItemTypeLabel = (type: NavbarItem['type']) => {
  const labels: Record<NavbarItem['type'], string> = {
    'link': 'Link',
    'internal': 'Link Interno',
    'external': 'Link Externo',
    'submenu': 'Submenu',
    'category': 'Categoria',
    'collection': 'Coleção',
    'page': 'Página',
    'dynamic-list': 'Lista Dinâmica',
    'custom-block': 'Bloco Visual',
  }
  return labels[type] || type
}

export function MenuTreeEditor({
  items,
  selectedItem,
  onSelectItem,
  onAddItem,
  onDeleteItem,
  onItemsChange,
}: MenuTreeEditorProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId)
    } else {
      newExpanded.add(itemId)
    }
    setExpandedItems(newExpanded)
  }

  const handleDragStart = (e: React.DragEvent, item: NavbarItem) => {
    e.dataTransfer.setData('text/plain', item.id)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, targetItem: NavbarItem | null) => {
    e.preventDefault()
    const draggedId = e.dataTransfer.getData('text/plain')
    
    if (draggedId === targetItem?.id) return

    // Mover item na árvore
    const moveItem = (items: NavbarItem[]): NavbarItem[] => {
      let draggedItem: NavbarItem | null = null
      
      // Remover item da posição atual
      const removeItem = (items: NavbarItem[]): NavbarItem[] => {
        return items
          .filter(item => {
            if (item.id === draggedId) {
              draggedItem = item
              return false
            }
            if (item.children) {
              item.children = removeItem(item.children)
            }
            return true
          })
      }

      const newItems = removeItem(items)
      
      if (!draggedItem) return items

      // Adicionar item na nova posição
      if (targetItem) {
        const addToItem = (items: NavbarItem[]): NavbarItem[] => {
          return items.map(item => {
            if (item.id === targetItem.id) {
              return {
                ...item,
                children: [...(item.children || []), { ...draggedItem!, parentId: item.id }],
              }
            }
            if (item.children) {
              return {
                ...item,
                children: addToItem(item.children),
              }
            }
            return item
          })
        }
        return addToItem(newItems)
      } else {
        // Adicionar como item raiz
        return [...newItems, { ...draggedItem, parentId: null }]
      }
    }

    onItemsChange(moveItem(items))
  }

  const renderItem = (item: NavbarItem, level: number = 0): React.ReactNode => {
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedItems.has(item.id)
    const isSelected = selectedItem?.id === item.id

    return (
      <div key={item.id} className="select-none">
        <div
          draggable
          onDragStart={(e) => handleDragStart(e, item)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, item)}
          onClick={() => onSelectItem(item)}
          className={`
            group flex items-center gap-2 px-4 py-2 cursor-pointer transition-colors
            ${isSelected ? 'bg-blue-50 border-l-2 border-l-blue-500' : 'hover:bg-gray-50'}
            ${level > 0 ? 'ml-4' : ''}
          `}
          style={{ paddingLeft: `${level * 16 + 16}px` }}
        >
          <GripVertical className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleExpanded(item.id)
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          ) : (
            <div className="w-4" />
          )}

          <div className="flex items-center gap-2 flex-1 min-w-0">
            {getItemIcon(item.type)}
            <span className="text-sm font-medium text-gray-900 truncate">{item.label}</span>
            <span className="text-xs text-gray-400">({getItemTypeLabel(item.type)})</span>
            {!item.visible && (
              <span className="text-xs text-gray-400">(oculto)</span>
            )}
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onAddItem(item.id)
              }}
              className="p-1 text-gray-400 hover:text-blue-600"
              title="Adicionar filho"
            >
              <Plus className="h-4 w-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDeleteItem(item.id)
              }}
              className="p-1 text-gray-400 hover:text-red-600"
              title="Remover"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div>
            {item.children!.map((child) => renderItem(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Itens do Menu</h2>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onAddItem()}
            className="flex items-center gap-1"
          >
            <Plus className="h-4 w-4" />
            Adicionar Item
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <p className="text-sm text-gray-500">Nenhum item no menu</p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onAddItem()}
                className="mt-2"
              >
                Adicionar Primeiro Item
              </Button>
            </div>
          </div>
        ) : (
          <div onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, null)}>
            {items.map((item) => renderItem(item))}
          </div>
        )}
      </div>
    </div>
  )
}


