'use client'

import Link from 'next/link'
import type { BannerBlockProps } from './types'

interface BannerBlockPropsWithStyles extends BannerBlockProps {
  blockId?: string
  elementStyles?: Record<string, any>
}

export function BannerBlock({
  image,
  cta_link,
  blockId,
  elementStyles
}: BannerBlockPropsWithStyles) {
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
        alt="Banner"
        className="w-full h-auto object-cover"
      />
    </div>
  )

  if (cta_link) {
    return (
      <Link href={cta_link} className="block">
        {content}
      </Link>
    )
  }

  return content
}

