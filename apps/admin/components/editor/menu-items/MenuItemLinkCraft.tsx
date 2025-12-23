'use client'

import React from 'react'
import { useNode } from '@craftjs/core'
import Link from 'next/link'

interface MenuItemLinkCraftProps {
  label: string
  url: string
  target?: '_self' | '_blank'
  icon?: string
}

export const MenuItemLinkCraft = ({
  label,
  url,
  target = '_self',
  icon,
}: MenuItemLinkCraftProps) => {
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
      {icon && <span className="text-sm">{icon}</span>}
      <Link href={url} target={target} className="text-sm font-medium text-text-primary">
        {label}
      </Link>
    </div>
  )
}

MenuItemLinkCraft.craft = {
  displayName: 'Menu Item - Link',
  props: {
    label: 'Link',
    url: '/',
    target: '_self',
  },
}









