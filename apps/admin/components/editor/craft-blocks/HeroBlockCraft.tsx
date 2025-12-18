'use client'

import React from 'react'
import { useNode } from '@craftjs/core'
import { Button } from '@white-label/ui'

interface HeroBlockCraftProps {
  title?: string
  subtitle?: string
  image?: string
  cta_text?: string
  cta_link?: string
  overlay_opacity?: number
  show_text?: boolean
  show_button?: boolean
}

export const HeroBlockCraft = ({
  title,
  subtitle,
  image,
  cta_text,
  cta_link,
  overlay_opacity = 0.3,
  show_text = true,
  show_button = true,
}: HeroBlockCraftProps) => {
  const { connectors: { connect, drag }, isSelected } = useNode((node) => ({
    isSelected: node.events.selected,
  }))

  const finalTitle = title || 'Bem-vindo à nossa loja'
  const finalSubtitle = subtitle || 'Descubra nossos produtos exclusivos'
  const finalImage = image

  if (!finalImage) {
    return (
      <div 
        ref={(ref: HTMLDivElement | null) => {
        if (ref) {
          connect(drag(ref))
        }
      }}
        className="w-full mb-10 sm:mb-14 relative overflow-hidden flex items-center justify-center bg-muted -mt-px lg:max-h-[800px] min-h-[400px] border-2 border-dashed border-gray-300"
      >
        <div className="text-center text-gray-400">
          <p>Adicione uma imagem para o Hero</p>
        </div>
      </div>
    )
  }

  return (
    <div 
      ref={(ref: HTMLDivElement | null) => {
        if (ref) {
          connect(drag(ref))
        }
      }}
      className={`w-full mb-10 sm:mb-14 relative overflow-hidden flex items-center justify-center bg-muted -mt-px lg:max-h-[800px] ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
    >
      <div className="w-full h-full flex items-center justify-center">
        <img
          src={finalImage}
          alt={finalTitle}
          className="w-full h-full object-cover object-center"
        />
      </div>
      
      {/* Overlay com gradiente - apenas se houver texto ou botão */}
      {(show_text || show_button) && (
        <div 
          className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent pointer-events-none"
          style={{ opacity: overlay_opacity }}
        />
      )}
      
      {/* Conteúdo do Hero - apenas se show_text ou show_button estiverem ativos */}
      {(show_text || show_button) && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="container mx-auto px-4 text-center">
            {show_text && (
              <>
                <h1 className="text-4xl md:text-6xl font-bold mb-4 text-foreground drop-shadow-lg">
                  {finalTitle}
                </h1>
                {finalSubtitle && (
                  <p className="text-lg md:text-xl mb-8 text-foreground/90 drop-shadow-md max-w-2xl mx-auto">
                    {finalSubtitle}
                  </p>
                )}
              </>
            )}
            {show_button && cta_text && cta_link && (
              <Button
                size="lg"
                className="bg-foreground text-background hover:bg-accent"
                asChild
              >
                <a href={cta_link}>{cta_text}</a>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const HeroBlockSettings = () => {
  const { actions: { setProp }, props } = useNode((node) => ({
    props: node.data.props,
  }))

  return (
    <div className="space-y-4 p-4">
      <div>
        <label className="block text-sm font-medium mb-2">Título</label>
        <input
          type="text"
          value={props.title || ''}
          onChange={(e) => setProp((props: HeroBlockCraftProps) => (props.title = e.target.value))}
          className="w-full px-3 py-2 border rounded"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Subtítulo</label>
        <textarea
          value={props.subtitle || ''}
          onChange={(e) => setProp((props: HeroBlockCraftProps) => (props.subtitle = e.target.value))}
          className="w-full px-3 py-2 border rounded"
          rows={3}
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">URL da Imagem</label>
        <input
          type="url"
          value={props.image || ''}
          onChange={(e) => setProp((props: HeroBlockCraftProps) => (props.image = e.target.value))}
          className="w-full px-3 py-2 border rounded"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Texto do Botão</label>
        <input
          type="text"
          value={props.cta_text || ''}
          onChange={(e) => setProp((props: HeroBlockCraftProps) => (props.cta_text = e.target.value))}
          className="w-full px-3 py-2 border rounded"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Link do Botão</label>
        <input
          type="text"
          value={props.cta_link || ''}
          onChange={(e) => setProp((props: HeroBlockCraftProps) => (props.cta_link = e.target.value))}
          className="w-full px-3 py-2 border rounded"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Opacidade do Overlay: {props.overlay_opacity || 0.3}</label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={props.overlay_opacity || 0.3}
          onChange={(e) => setProp((props: HeroBlockCraftProps) => (props.overlay_opacity = parseFloat(e.target.value)))}
          className="w-full"
        />
      </div>
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          checked={props.show_text !== false}
          onChange={(e) => setProp((props: HeroBlockCraftProps) => (props.show_text = e.target.checked))}
          className="rounded"
        />
        <label className="text-sm">Mostrar Texto</label>
      </div>
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          checked={props.show_button !== false}
          onChange={(e) => setProp((props: HeroBlockCraftProps) => (props.show_button = e.target.checked))}
          className="rounded"
        />
        <label className="text-sm">Mostrar Botão</label>
      </div>
    </div>
  )
}

// Definir craft após HeroBlockSettings
HeroBlockCraft.craft = {
  displayName: 'Hero Block',
  props: {
    title: 'Bem-vindo à nossa loja',
    subtitle: 'Descubra nossos produtos exclusivos',
    image: '',
    cta_text: 'Comprar Agora',
    cta_link: '/products',
    overlay_opacity: 0.3,
    show_text: true,
    show_button: true,
  },
  related: {
    settings: HeroBlockSettings,
  },
}

