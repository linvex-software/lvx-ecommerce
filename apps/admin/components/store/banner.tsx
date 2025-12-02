'use client'

import { useNode } from '@craftjs/core'
import { useMemo } from 'react'

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
  const {
    connectors: { connect, drag },
    isActive
  } = useNode((state) => ({
    isActive: state.events.selected
  }))

  const content = (
    <div
      className={`relative overflow-hidden ${isActive ? 'ring-2 ring-blue-500' : ''}`}
      style={{
        borderRadius: `${borderRadius}px`,
        padding: `${padding}px`,
        margin: `${margin}px 0`,
        height: `${height}px`,
        backgroundColor: '#f3f4f6'
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
          <span>Adicione uma URL de imagem</span>
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
      <a
        href={linkUrl}
        ref={(ref) => {
          if (ref) {
            connect(drag(ref))
          }
        }}
        className="block"
      >
        {content}
      </a>
    )
  }

  return (
    <div
      ref={(ref) => {
        if (ref) {
          connect(drag(ref))
        }
      }}
    >
      {content}
    </div>
  )
}

Banner.craft = {
  displayName: 'Banner',
  props: {
    imageUrl: '',
    title: 'Banner',
    linkUrl: '',
    borderRadius: 8,
    padding: 0,
    margin: 0,
    height: 300
  },
  related: {
    settings: BannerSettings
  }
}

function BannerSettings() {
  const {
    actions: { setProp },
    imageUrl,
    title,
    linkUrl,
    borderRadius,
    padding,
    margin,
    height
  } = useNode((node) => ({
    imageUrl: node.data.props.imageUrl || '',
    title: node.data.props.title || 'Banner',
    linkUrl: node.data.props.linkUrl || '',
    borderRadius: node.data.props.borderRadius ?? 8,
    padding: node.data.props.padding ?? 0,
    margin: node.data.props.margin ?? 0,
    height: node.data.props.height ?? 300
  }))

  return (
    <div className="space-y-4 p-4">
      <div>
        <label className="block text-sm font-medium mb-1">URL da Imagem</label>
        <input
          type="text"
          value={imageUrl}
          onChange={(e) =>
            setProp((props: BannerProps) => (props.imageUrl = e.target.value))
          }
          className="w-full px-3 py-2 border rounded-md"
          placeholder="https://exemplo.com/imagem.jpg"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Título</label>
        <input
          type="text"
          value={title}
          onChange={(e) =>
            setProp((props: BannerProps) => (props.title = e.target.value))
          }
          className="w-full px-3 py-2 border rounded-md"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Link (opcional)</label>
        <input
          type="text"
          value={linkUrl}
          onChange={(e) =>
            setProp((props: BannerProps) => (props.linkUrl = e.target.value))
          }
          className="w-full px-3 py-2 border rounded-md"
          placeholder="https://exemplo.com"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Border Radius: {borderRadius}px
        </label>
        <input
          type="range"
          min={0}
          max={32}
          value={borderRadius}
          onChange={(e) =>
            setProp(
              (props: BannerProps) =>
                (props.borderRadius = Number(e.target.value))
            )
          }
          className="w-full"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Padding: {padding}px
        </label>
        <input
          type="range"
          min={0}
          max={64}
          value={padding}
          onChange={(e) =>
            setProp(
              (props: BannerProps) => (props.padding = Number(e.target.value))
            )
          }
          className="w-full"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Margin: {margin}px
        </label>
        <input
          type="range"
          min={0}
          max={64}
          value={margin}
          onChange={(e) =>
            setProp(
              (props: BannerProps) => (props.margin = Number(e.target.value))
            )
          }
          className="w-full"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Altura: {height}px
        </label>
        <input
          type="range"
          min={100}
          max={600}
          value={height}
          onChange={(e) =>
            setProp(
              (props: BannerProps) => (props.height = Number(e.target.value))
            )
          }
          className="w-full"
        />
      </div>
    </div>
  )
}

