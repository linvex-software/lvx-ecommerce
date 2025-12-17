'use client'

import React, { useState, useEffect } from 'react'
import { useNode } from '@craftjs/core'

interface TextBlockCraftProps {
  content?: string
  align?: 'left' | 'center' | 'right'
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export const TextBlockCraft = ({
  content = 'Este é um bloco de texto. Clique para editar.',
  align = 'left',
  size = 'md',
}: TextBlockCraftProps) => {
  const { connectors: { connect, drag }, actions: { setProp }, isSelected } = useNode((node) => ({
    isSelected: node.events.selected,
  }))

  const [editable, setEditable] = useState(false)
  const [localContent, setLocalContent] = useState(content)

  useEffect(() => {
    setLocalContent(content)
  }, [content])

  useEffect(() => {
    if (!isSelected) {
      setEditable(false)
    }
  }, [isSelected])

  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  }

  if (!content) {
    return null
  }

  return (
    <section 
      ref={(ref: HTMLDivElement | null) => {
        if (ref) {
          connect(drag(ref))
        }
      }}
      className={`container mx-auto px-4 py-12 ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
    >
      <div className={`max-w-4xl mx-auto ${alignClasses[align]}`}>
        {editable ? (
          <textarea
            value={localContent}
            onChange={(e) => setLocalContent(e.target.value)}
            onBlur={() => {
              setProp((props: TextBlockCraftProps) => (props.content = localContent))
              setEditable(false)
            }}
            className="w-full prose prose-lg max-w-none border-2 border-blue-500 rounded p-2 focus:outline-none"
            autoFocus
            rows={5}
          />
        ) : (
          <div
            onClick={() => isSelected && setEditable(true)}
            className={`prose prose-lg max-w-none cursor-text ${isSelected ? 'hover:bg-blue-50 rounded p-2' : ''}`}
            dangerouslySetInnerHTML={{ __html: localContent }}
          />
        )}
      </div>
    </section>
  )
}

const TextBlockSettings = () => {
  const { actions: { setProp }, props } = useNode((node) => ({
    props: node.data.props,
  }))

  return (
    <div className="space-y-4 p-4">
      <div>
        <label className="block text-sm font-medium mb-2">Conteúdo</label>
        <textarea
          value={props.content || ''}
          onChange={(e) => setProp((props: TextBlockCraftProps) => (props.content = e.target.value))}
          className="w-full px-3 py-2 border rounded"
          rows={5}
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Alinhamento</label>
        <select
          value={props.align || 'left'}
          onChange={(e) => setProp((props: TextBlockCraftProps) => (props.align = e.target.value as 'left' | 'center' | 'right'))}
          className="w-full px-3 py-2 border rounded"
        >
          <option value="left">Esquerda</option>
          <option value="center">Centro</option>
          <option value="right">Direita</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Tamanho</label>
        <select
          value={props.size || 'md'}
          onChange={(e) => setProp((props: TextBlockCraftProps) => (props.size = e.target.value as 'sm' | 'md' | 'lg' | 'xl'))}
          className="w-full px-3 py-2 border rounded"
        >
          <option value="sm">Pequeno</option>
          <option value="md">Médio</option>
          <option value="lg">Grande</option>
          <option value="xl">Extra Grande</option>
        </select>
      </div>
    </div>
  )
}

TextBlockCraft.craft = {
  displayName: 'Texto',
  props: {
    content: 'Este é um bloco de texto. Clique para editar.',
    align: 'left',
    size: 'md',
  },
  related: {
    settings: TextBlockSettings,
  },
}

