'use client'

import React from 'react'
import { useNode } from '@craftjs/core'

interface ContainerCraftProps {
  background?: string
  padding?: number
  children?: React.ReactNode
}

export const ContainerCraft = ({ background = '#ffffff', padding = 0, children }: ContainerCraftProps) => {
  const { connectors: { connect, drag } } = useNode()

  return (
    <div
      ref={(ref: HTMLDivElement | null) => connect(drag(ref))}
      style={{
        background,
        padding: `${padding}px`,
        minHeight: '50px',
      }}
      className="rounded-lg"
    >
      {children}
    </div>
  )
}

const ContainerSettings = () => {
  const { background, padding, actions: { setProp } } = useNode((node) => ({
    background: node.data.props.background,
    padding: node.data.props.padding,
  }))

  return (
    <div className="space-y-4 p-4">
      <div>
        <label className="block text-sm font-medium mb-2">Background Color</label>
        <input
          type="color"
          value={background || '#ffffff'}
          onChange={(e) => setProp((props: ContainerCraftProps) => (props.background = e.target.value))}
          className="w-full h-10 rounded border"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Padding: {padding}px</label>
        <input
          type="range"
          min="0"
          max="50"
          value={padding || 0}
          onChange={(e) => setProp((props: ContainerCraftProps) => (props.padding = parseInt(e.target.value)))}
          className="w-full"
        />
      </div>
    </div>
  )
}

ContainerCraft.craft = {
  displayName: 'Container',
  props: {
    background: '#ffffff',
    padding: 0,
  },
  related: {
    settings: ContainerSettings,
  },
}

