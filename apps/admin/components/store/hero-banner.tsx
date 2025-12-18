'use client'

import { useNode, useEditor } from '@craftjs/core'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { ImageField, TextField } from '@/components/editor/settings'

interface HeroBannerItem {
  imageUrl: string
  title: string
  subtitle: string
  primaryButtonText: string
  primaryButtonLink?: string
  secondaryButtonText: string
  secondaryButtonLink?: string
}

interface HeroBannerProps {
  items?: HeroBannerItem[]
  gap?: number
  padding?: number
}

const defaultItems: HeroBannerItem[] = [
  {
    imageUrl: '',
    title: 'Abrace Sua Elegância Feminina',
    subtitle: 'O Essencial Que Faltava No Seu Guarda-Roupa – Acabamos De Repor!',
    primaryButtonText: 'Comprar esta blusa',
    primaryButtonLink: '#',
    secondaryButtonText: 'Mulheres',
    secondaryButtonLink: '#'
  },
  {
    imageUrl: '',
    title: 'Feito Para O Homem Moderno',
    subtitle: 'A Única Camiseta Que Você Vai Precisar',
    primaryButtonText: 'Comprar esta camiseta',
    primaryButtonLink: '#',
    secondaryButtonText: 'Homens',
    secondaryButtonLink: '#'
  }
]

export function HeroBanner({
  items = defaultItems,
  gap = 40,
  padding = 60
}: HeroBannerProps) {
  const {
    connectors: { connect, drag },
    isActive
  } = useNode((state) => ({
    isActive: state.events.selected
  }))

  const { enabled } = useEditor((state) => ({
    enabled: state.options.enabled
  }))

  return (
    <div
      ref={(ref) => {
        if (ref) {
          connect(drag(ref))
        }
      }}
      className={`relative overflow-hidden w-full ${isActive ? 'ring-2 ring-blue-500' : ''}`}
      style={{
        cursor: enabled ? 'move' : 'default',
        width: enabled ? '100%' : '100vw',
        marginLeft: enabled ? 0 : 'calc(50% - 50vw)',
        marginRight: enabled ? 0 : 'calc(50% - 50vw)',
        padding: `100px ${padding}px`
      }}
    >
      <div
        className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-[40px]"
        style={{
          gap: `${gap}px`
        }}
      >
        {items.map((item, index) => (
          <div
            key={index}
            className="relative flex flex-col gap-6"
            style={{
              gap: '26px'
            }}
          >
            {/* Image Container */}
            <div
              className="relative w-full overflow-hidden rounded-lg"
              style={{
                height: '700px',
                backgroundColor: '#D9D9D9'
              }}
            >
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-400 text-sm">Imagem {index + 1}</span>
                </div>
              )}
            </div>

            {/* Content */}
            <div
              className="flex flex-col gap-6"
              style={{
                gap: '24px',
                maxWidth: '446px'
              }}
            >
              {/* Text Content */}
              <div className="flex flex-col gap-2">
                <h2
                  className="text-2xl font-semibold"
                  style={{
                    fontFamily: 'Montserrat, sans-serif',
                    fontSize: '24px',
                    lineHeight: '1.1666666666666667em',
                    color: '#000000'
                  }}
                >
                  {item.title}
                </h2>
                <p
                  className="text-lg"
                  style={{
                    fontFamily: 'Roboto, sans-serif',
                    fontSize: '20px',
                    lineHeight: '1.6em',
                    color: '#000000'
                  }}
                >
                  {item.subtitle}
                </p>
              </div>

              {/* Buttons */}
              <div
                className="flex flex-wrap gap-6"
                style={{
                  gap: '24px'
                }}
              >
                {item.primaryButtonText && (
                  <Link
                    href={item.primaryButtonLink || '#'}
                    className="inline-flex items-center justify-center gap-3 px-6 py-2 border border-[#BFBFBF] rounded-sm bg-[#FAFAFA] hover:bg-gray-50 transition-colors"
                    style={{
                      fontFamily: 'Roboto, sans-serif',
                      fontSize: '16px',
                      lineHeight: '1.5em',
                      color: '#000000',
                      borderWidth: '1px',
                      borderColor: '#BFBFBF'
                    }}
                  >
                    {item.primaryButtonText}
                    <ArrowRight className="w-6 h-6" />
                  </Link>
                )}
                {item.secondaryButtonText && (
                  <Link
                    href={item.secondaryButtonLink || '#'}
                    className="inline-flex items-center justify-center px-6 py-2 rounded-sm bg-[#562E16] hover:bg-[#6b3a1c] transition-colors"
                    style={{
                      fontFamily: 'Roboto, sans-serif',
                      fontSize: '16px',
                      lineHeight: '1.5em',
                      color: '#FFFFFF'
                    }}
                  >
                    {item.secondaryButtonText}
                  </Link>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

HeroBanner.craft = {
  displayName: 'Hero Banner',
  props: {
    items: defaultItems,
    gap: 40,
    padding: 60
  },
  related: {
    settings: HeroBannerSettings
  }
}

function HeroBannerSettings() {
  const {
    actions: { setProp },
    items,
    gap,
    padding
  } = useNode((node) => ({
    items: node.data.props.items || defaultItems,
    gap: node.data.props.gap || 40,
    padding: node.data.props.padding || 60
  }))

  return (
    <div className="space-y-4 p-4">
      <div>
        <label className="block text-sm font-medium mb-2">Gap entre colunas (px)</label>
        <input
          type="number"
          value={gap}
          onChange={(e) => setProp((props: HeroBannerProps) => (props.gap = parseInt(e.target.value) || 40))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          min="0"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Padding horizontal (px)</label>
        <input
          type="number"
          value={padding}
          onChange={(e) => setProp((props: HeroBannerProps) => (props.padding = parseInt(e.target.value) || 60))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          min="0"
        />
      </div>
      {items.map((item: any, index: number) => (
        <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3">
          <h3 className="font-semibold text-sm">Item {index + 1}</h3>

          <ImageField
            label="Imagem"
            value={{ url: item.imageUrl }}
            onChange={(image) => {
              const newItems = [...items]
              newItems[index].imageUrl = image.url || ''
              setProp((props: HeroBannerProps) => (props.items = newItems))
            }}
            showAdvanced={false}
          />

          <TextField
            label="Título"
            value={item.title}
            onChange={(value) => {
              const newItems = [...items]
              newItems[index].title = value
              setProp((props: HeroBannerProps) => (props.items = newItems))
            }}
          />

          <TextField
            label="Subtítulo"
            value={item.subtitle}
            onChange={(value) => {
              const newItems = [...items]
              newItems[index].subtitle = value
              setProp((props: HeroBannerProps) => (props.items = newItems))
            }}
            type="textarea"
            rows={2}
          />

          <TextField
            label="Texto Botão Primário"
            value={item.primaryButtonText}
            onChange={(value) => {
              const newItems = [...items]
              newItems[index].primaryButtonText = value
              setProp((props: HeroBannerProps) => (props.items = newItems))
            }}
          />

          <TextField
            label="Link Botão Primário"
            value={item.primaryButtonLink || ''}
            onChange={(value) => {
              const newItems = [...items]
              newItems[index].primaryButtonLink = value
              setProp((props: HeroBannerProps) => (props.items = newItems))
            }}
            type="url"
            placeholder="https://..."
          />

          <TextField
            label="Texto Botão Secundário"
            value={item.secondaryButtonText}
            onChange={(value) => {
              const newItems = [...items]
              newItems[index].secondaryButtonText = value
              setProp((props: HeroBannerProps) => (props.items = newItems))
            }}
          />

          <TextField
            label="Link Botão Secundário"
            value={item.secondaryButtonLink || ''}
            onChange={(value) => {
              const newItems = [...items]
              newItems[index].secondaryButtonLink = value
              setProp((props: HeroBannerProps) => (props.items = newItems))
            }}
            type="url"
            placeholder="https://..."
          />
        </div>
      ))}
    </div>
  )
}

