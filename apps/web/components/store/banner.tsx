'use client'

import Link from 'next/link'

interface BannerProps {
  imageUrl?: string
  title?: string
  linkUrl?: string
  borderRadius?: number
  padding?: number
  margin?: number
  height?: number
}

export function Banner({
  imageUrl = '',
  title = 'Banner',
  linkUrl = '',
  borderRadius = 8,
  padding = 0,
  margin = 0,
  height = 300
}: BannerProps) {
  const content = (
    <div
      className="relative overflow-hidden"
      style={{
        borderRadius: `${borderRadius}px`,
        padding: `${padding}px`,
        margin: `${margin}px 0`,
        height: `${height}px`,
        backgroundColor: '#f3f4f6',
      }}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-gray-400">
          <span>Sem imagem</span>
        </div>
      )}
      {title && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
          <h2 className="text-white text-2xl font-bold">{title}</h2>
        </div>
      )}
    </div>
  )

  if (linkUrl) {
    return (
      <Link href={linkUrl} className="block">
        {content}
      </Link>
    )
  }

  return <div>{content}</div>
}




