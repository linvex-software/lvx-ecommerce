'use client'

import React from 'react'
import { useNode } from '@craftjs/core'
import { Button } from '@white-label/ui'

interface BannerBlockCraftProps {
  image?: string
  title?: string
  subtitle?: string
  cta_text?: string
  cta_link?: string
  position?: 'top' | 'middle' | 'bottom'
}

export const BannerBlockCraft = ({
  image,
  title,
  subtitle,
  cta_text,
  cta_link,
  position = 'middle',
}: BannerBlockCraftProps) => {
  const { connectors: { connect, drag }, isSelected } = useNode((node) => ({
    isSelected: node.events.selected,
  }))

  if (!image) {
    return null
  }

  return (
    <section 
      ref={(ref: HTMLDivElement | null) => {
        if (ref) {
          connect(drag(ref))
        }
      }}
      className={`w-full ${position === 'top' ? 'mb-10' : position === 'bottom' ? 'mt-10' : 'my-10'} ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
    >
      <div className="relative overflow-hidden rounded-lg">
        <img
          src={image}
          alt={title || 'Banner'}
          className="w-full h-full object-cover"
        />
        {(title || subtitle || cta_text) && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <div className="container mx-auto px-4 text-center">
              {title && (
                <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
                  {title}
                </h2>
              )}
              {subtitle && (
                <p className="text-lg mb-6 text-white/90 max-w-2xl mx-auto">
                  {subtitle}
                </p>
              )}
              {cta_text && cta_link && (
                <Button
                  size="lg"
                  className="bg-white text-black hover:bg-gray-100"
                  asChild
                >
                  <a href={cta_link}>{cta_text}</a>
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

const BannerBlockSettings = () => {
  const { actions: { setProp }, props } = useNode((node) => ({
    props: node.data.props,
  }))

  return (
    <div className="space-y-4 p-4">
      <div>
        <label className="block text-sm font-medium mb-2">URL da Imagem</label>
        <input
          type="url"
          value={props.image || ''}
          onChange={(e) => setProp((props: BannerBlockCraftProps) => (props.image = e.target.value))}
          className="w-full px-3 py-2 border rounded"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Título</label>
        <input
          type="text"
          value={props.title || ''}
          onChange={(e) => setProp((props: BannerBlockCraftProps) => (props.title = e.target.value))}
          className="w-full px-3 py-2 border rounded"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Subtítulo</label>
        <input
          type="text"
          value={props.subtitle || ''}
          onChange={(e) => setProp((props: BannerBlockCraftProps) => (props.subtitle = e.target.value))}
          className="w-full px-3 py-2 border rounded"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Texto do Botão</label>
        <input
          type="text"
          value={props.cta_text || ''}
          onChange={(e) => setProp((props: BannerBlockCraftProps) => (props.cta_text = e.target.value))}
          className="w-full px-3 py-2 border rounded"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Link do Botão</label>
        <input
          type="text"
          value={props.cta_link || ''}
          onChange={(e) => setProp((props: BannerBlockCraftProps) => (props.cta_link = e.target.value))}
          className="w-full px-3 py-2 border rounded"
        />
      </div>
    </div>
  )
}

BannerBlockCraft.craft = {
  displayName: 'Banner',
  props: {
    image: '',
    title: '',
    subtitle: '',
    cta_text: '',
    cta_link: '/',
    position: 'middle',
  },
  related: {
    settings: BannerBlockSettings,
  },
}

