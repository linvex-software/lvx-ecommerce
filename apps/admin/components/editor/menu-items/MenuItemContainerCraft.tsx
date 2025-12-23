'use client'

import React from 'react'
import { useNode, Element } from '@craftjs/core'
import { ChevronDown } from 'lucide-react'

interface MenuItemContainerCraftProps {
  label: string
  children?: React.ReactNode
}

export const MenuItemContainerCraft = ({
  label,
  children,
}: MenuItemContainerCraftProps) => {
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
        ${isSelected ? 'bg-primary/10 ring-2 ring-primary' : 'hover:bg-hover'}
      `}
    >
      <span className="text-sm font-medium text-text-primary">{label}</span>
      <ChevronDown className="h-4 w-4 text-text-secondary" />
      <span className="text-xs text-text-tertiary">(Submenu)</span>
      {children && (
        <div className="ml-4 mt-2">
          {children}
        </div>
      )}
    </div>
  )
}

MenuItemContainerCraft.craft = {
  displayName: 'Menu Item - Container',
  props: {
    label: 'Submenu',
  },
  rules: {
    canMoveIn: (incomingNodes: any[]) => {
      return incomingNodes.every((node) => 
        node.data.type.resolvedName.startsWith('MenuItem')
      )
    },
  },
}









