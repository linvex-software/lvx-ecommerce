'use client'

import React from 'react'
import { useNode } from '@craftjs/core'
import { Image } from 'lucide-react'

interface MenuItemCustomBlockCraftProps {
  label: string
  config?: {
    blockType?: 'banner' | 'image' | 'product-card' | 'cta'
    blockData?: Record<string, unknown>
  }
}

export const MenuItemCustomBlockCraft = ({
  label,
  config,
}: MenuItemCustomBlockCraftProps) => {
  const { connectors: { connect, drag }, isSelected } = useNode((node) => ({
    isSelected: node.events.selected,
  }))

  const blockTypeLabels = {
    'banner': 'Banner',
    'image': 'Imagem',
    'product-card': 'Card de Produto',
    'cta': 'CTA',
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
      <Image className="h-4 w-4 text-gray-500" />
      <span className="text-sm font-medium text-gray-900">{label}</span>
      {config?.blockType && (
        <span className="text-xs text-gray-400">
          ({blockTypeLabels[config.blockType]})
        </span>
      )}
    </div>
  )
}

MenuItemCustomBlockCraft.craft = {
  displayName: 'Menu Item - Custom Block',
  props: {
    label: 'Bloco Visual',
    config: {
      blockType: 'banner',
    },
  },
}


