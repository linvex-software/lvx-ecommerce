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
        ${isSelected ? 'bg-blue-100 ring-2 ring-blue-500' : 'hover:bg-gray-100'}
      `}
    >
      {icon && <span className="text-sm">{icon}</span>}
      <Link href={url} target={target} className="text-sm font-medium text-gray-900">
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








