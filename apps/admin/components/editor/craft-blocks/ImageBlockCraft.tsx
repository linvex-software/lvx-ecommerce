'use client'

import React from 'react'
import { useNode } from '@craftjs/core'

interface ImageBlockCraftProps {
  src?: string
  alt?: string
  width?: number
  height?: number
  align?: 'left' | 'center' | 'right'
}

export const ImageBlockCraft = ({
  src,
  alt = 'Imagem',
  width,
  height,
  align = 'center',
}: ImageBlockCraftProps) => {
  const { connectors: { connect, drag }, isSelected } = useNode((node) => ({
    isSelected: node.events.selected,
  }))

  const alignClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
  }

  if (!src) {
    return null
  }

  return (
    <section 
      ref={(ref: HTMLDivElement | null) => connect(drag(ref))}
      className={`container mx-auto px-4 py-12 ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
    >
      <div className={`flex ${alignClasses[align]}`}>
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          className="max-w-full h-auto rounded-lg"
        />
      </div>
    </section>
  )
}

const ImageBlockSettings = () => {
  const { actions: { setProp }, props } = useNode((node) => ({
    props: node.data.props,
  }))

  return (
    <div className="space-y-4 p-4">
      <div>
        <label className="block text-sm font-medium mb-2">URL da Imagem</label>
        <input
          type="url"
          value={props.src || ''}
          onChange={(e) => setProp((props: ImageBlockCraftProps) => (props.src = e.target.value))}
          className="w-full px-3 py-2 border rounded"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Texto Alternativo</label>
        <input
          type="text"
          value={props.alt || ''}
          onChange={(e) => setProp((props: ImageBlockCraftProps) => (props.alt = e.target.value))}
          className="w-full px-3 py-2 border rounded"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Largura (px)</label>
          <input
            type="number"
            value={props.width || ''}
            onChange={(e) => setProp((props: ImageBlockCraftProps) => (props.width = e.target.value ? parseInt(e.target.value) : undefined))}
            className="w-full px-3 py-2 border rounded"
            placeholder="auto"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Altura (px)</label>
          <input
            type="number"
            value={props.height || ''}
            onChange={(e) => setProp((props: ImageBlockCraftProps) => (props.height = e.target.value ? parseInt(e.target.value) : undefined))}
            className="w-full px-3 py-2 border rounded"
            placeholder="auto"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Alinhamento</label>
        <select
          value={props.align || 'center'}
          onChange={(e) => setProp((props: ImageBlockCraftProps) => (props.align = e.target.value as 'left' | 'center' | 'right'))}
          className="w-full px-3 py-2 border rounded"
        >
          <option value="left">Esquerda</option>
          <option value="center">Centro</option>
          <option value="right">Direita</option>
        </select>
      </div>
    </div>
  )
}

ImageBlockCraft.craft = {
  displayName: 'Imagem',
  props: {
    src: '',
    alt: 'Imagem',
    width: undefined,
    height: undefined,
    align: 'center',
  },
  related: {
    settings: ImageBlockSettings,
  },
}

