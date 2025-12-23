'use client'

import React from 'react'
import { useNode } from '@craftjs/core'
import Link from 'next/link'

interface MenuItemPageCraftProps {
  label: string
  pageId?: string
  url?: string
}

export const MenuItemPageCraft = ({
  label,
  pageId,
  url,
}: MenuItemPageCraftProps) => {
  const { connectors: { connect, drag }, isSelected } = useNode((node) => ({
    isSelected: node.events.selected,
  }))

  const href = url || (pageId ? `/page/${pageId}` : '#')

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
      <Link href={href} className="text-sm font-medium text-text-primary">
        {label}
      </Link>
      <span className="text-xs text-text-tertiary">(Página)</span>
    </div>
  )
}

MenuItemPageCraft.craft = {
  displayName: 'Menu Item - Page',
  props: {
    label: 'Página',
  },
}









