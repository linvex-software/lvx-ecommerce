'use client'

import React from 'react'
import { useNode } from '@craftjs/core'
import { ChevronDown } from 'lucide-react'

interface MenuItemCategoryCraftProps {
  label: string
  config?: {
    showAll?: boolean
    selectedCategories?: string[]
    displayType?: 'list' | 'columns' | 'mega-menu'
    showImages?: boolean
  }
}

export const MenuItemCategoryCraft = ({
  label,
  config,
}: MenuItemCategoryCraftProps) => {
  const { connectors: { connect, drag }, isSelected } = useNode((node) => ({
    isSelected: node.events.selected,
  }))

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
      <span className="text-sm font-medium text-gray-900">{label}</span>
      <ChevronDown className="h-4 w-4 text-gray-500" />
      <span className="text-xs text-gray-400">(Categorias)</span>
    </div>
  )
}

MenuItemCategoryCraft.craft = {
  displayName: 'Menu Item - Category',
  props: {
    label: 'Categorias',
    config: {
      showAll: true,
      displayType: 'list',
    },
  },
}



