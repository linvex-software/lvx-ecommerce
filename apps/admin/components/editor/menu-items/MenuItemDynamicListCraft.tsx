'use client'

import React from 'react'
import { useNode } from '@craftjs/core'
import { List } from 'lucide-react'

interface MenuItemDynamicListCraftProps {
  label: string
  config?: {
    listType?: 'featured' | 'on-sale' | 'best-sellers' | 'new-arrivals'
    limit?: number
  }
}

export const MenuItemDynamicListCraft = ({
  label,
  config,
}: MenuItemDynamicListCraftProps) => {
  const { connectors: { connect, drag }, isSelected } = useNode((node) => ({
    isSelected: node.events.selected,
  }))

  const listTypeLabels = {
    'featured': 'Em Destaque',
    'on-sale': 'Em Oferta',
    'best-sellers': 'Mais Vendidos',
    'new-arrivals': 'Lançamentos',
  }

  return (
    <div
      ref={(ref: HTMLDivElement | null) => {
        if (ref) {
          connect(drag(ref))
        }
      }}
      className={`
        inline-flex items-center gap-2 px-3 py-2 rounded-md transition-colors
        ${isSelected ? 'bg-blue-100 ring-2 ring-blue-500' : 'hover:bg-gray-100'}
      `}
    >
      <List className="h-4 w-4 text-gray-500" />
      <span className="text-sm font-medium text-gray-900">{label}</span>
      {config?.listType && (
        <span className="text-xs text-gray-400">
          ({listTypeLabels[config.listType]})
        </span>
      )}
    </div>
  )
}

MenuItemDynamicListCraft.craft = {
  displayName: 'Menu Item - Dynamic List',
  props: {
    label: 'Lista Dinâmica',
    config: {
      listType: 'featured',
      limit: 10,
    },
  },
}


