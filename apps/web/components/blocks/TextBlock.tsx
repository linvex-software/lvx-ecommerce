'use client'

import type { Block } from './types'

interface TextBlockProps {
  content?: string
  align?: 'left' | 'center' | 'right'
  blockId?: string
  elementStyles?: Record<string, any>
}

export function TextBlock({ content = '', align = 'left', blockId, elementStyles }: TextBlockProps) {
  if (!content) {
    return null
  }

  const alignClass = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right'
  }[align]

  return (
    <section className="container mx-auto px-4 py-12">
      <div className={`max-w-4xl mx-auto ${alignClass}`}>
        <div 
          data-builder-id={blockId ? `${blockId}-content` : undefined}
          className="prose prose-lg max-w-none" 
          dangerouslySetInnerHTML={{ __html: content }}
          style={blockId && elementStyles?.[`${blockId}-content`]}
        />
      </div>
    </section>
  )
}

