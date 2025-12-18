'use client'

import type { ImageBlockProps } from './types'

interface ImageBlockPropsWithStyles extends ImageBlockProps {
  blockId?: string
  elementStyles?: Record<string, any>
}

export function ImageBlock({
  image,
  alt_text = 'Imagem',
  link,
  blockId,
  elementStyles
}: ImageBlockPropsWithStyles) {
  if (!image) {
    return null
  }

  const content = (
    <div
      id={blockId}
      className="w-full"
      style={elementStyles}
    >
      <img
        src={image}
        alt={alt_text}
        className="w-full h-auto object-cover"
      />
    </div>
  )

  if (link) {
    return (
      <a href={link} target="_blank" rel="noopener noreferrer" className="block">
        {content}
      </a>
    )
  }

  return content
}

