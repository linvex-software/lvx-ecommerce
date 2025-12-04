'use client'

import { useNode } from '@craftjs/core'
import Link from 'next/link'
import { cn } from '@white-label/ui'
import { useProducts } from '@/lib/hooks/use-products'
import { useContext } from 'react'
import { PreviewContext } from '@/components/editor/preview-context'

interface BentoCard {
  productId?: string
  colSpan?: 1 | 2 | 3
  enabled?: boolean
}

interface ProdutosBentoGridProps {
  title?: string
  backgroundColor?: string
  card1?: BentoCard
  card2?: BentoCard
  card3?: BentoCard
  card4?: BentoCard
  card5?: BentoCard
}

const ALLOWED_COLORS = [
  '#f3f4f6', // Cinza claro (padrão)
  '#e5e7eb', // Cinza médio
  '#d1d5db', // Cinza
  '#9ca3af', // Cinza escuro
  '#ffffff', // Branco
  '#000000', // Preto
  '#1f2937', // Cinza muito escuro
  '#3b82f6', // Azul
  '#10b981', // Verde
  '#f59e0b', // Laranja
  '#ef4444', // Vermelho
  '#8b5cf6', // Roxo
  '#ec4899'  // Rosa
]

const defaultCard1: BentoCard = {
  enabled: false,
  colSpan: 1
}

const defaultCard2: BentoCard = {
  enabled: false,
  colSpan: 1
}

const defaultCard3: BentoCard = {
  enabled: false,
  colSpan: 1
}

const defaultCard4: BentoCard = {
  enabled: false,
  colSpan: 1
}

const defaultCard5: BentoCard = {
  enabled: false,
  colSpan: 1
}

export function ProdutosBentoGrid({
  title,
  backgroundColor = '#f3f4f6',
  card1 = defaultCard1,
  card2 = defaultCard2,
  card3 = defaultCard3,
  card4 = defaultCard4,
  card5 = defaultCard5
}: ProdutosBentoGridProps) {
  const {
    connectors: { connect, drag },
    isActive
  } = useNode((state) => ({
    isActive: state.events.selected
  }))

  // Detectar modo de preview do editor de forma segura
  const previewContext = useContext(PreviewContext)
  const previewMode = previewContext?.previewMode || 'desktop'

  const { data: products } = useProducts({ limit: 100 })

  const getProduct = (productId?: string) => {
    if (!productId) return null
    return products?.products?.find(p => p.id === productId)
  }

  const safeBackgroundColor = ALLOWED_COLORS.includes(backgroundColor)
    ? backgroundColor
    : ALLOWED_COLORS[0]

  const renderCard = (card: BentoCard, index: number) => {
    if (!card.enabled || !card.productId) return null

    const product = getProduct(card.productId)
    if (!product || !product.main_image) return null

    const colSpan = card.colSpan || 1
    // No modo mobile do editor, sempre 1 coluna
    const isMobilePreview = previewMode === 'mobile'
    const colSpanClass = isMobilePreview
      ? 'col-span-1'
      : colSpan === 3 ? 'col-span-1 md:col-span-3' :
        colSpan === 2 ? 'col-span-1 md:col-span-2' :
        'col-span-1 md:col-span-1'
    const productLink = `/products/${product.slug}`

    return (
      <Link
        key={index}
        href={productLink}
        className={cn(
          colSpanClass,
          'overflow-hidden md:hover:scale-[1.02] hover:shadow-lg transition-all duration-200 ease-in-out h-[330px] rounded-xl relative group'
        )}
        onMouseEnter={(e) => {
          const overlay = e.currentTarget.querySelector('.bento-overlay') as HTMLElement
          if (overlay) {
            overlay.style.opacity = '0'
          }
        }}
        onMouseLeave={(e) => {
          const overlay = e.currentTarget.querySelector('.bento-overlay') as HTMLElement
          if (overlay) {
            overlay.style.opacity = '0.7'
          }
        }}
      >
        {/* Background color - deve ficar ATRÁS da imagem */}
        <div 
          className="absolute inset-0 rounded-xl z-0"
          style={{
            backgroundColor: safeBackgroundColor
          }}
        />
        {/* Imagem - deve ficar ACIMA do background */}
        <img
          src={product.main_image}
          alt={product.name}
          className="w-full h-full object-cover rounded-xl relative z-10"
        />
      </Link>
    )
  }

  return (
    <section
      ref={(ref) => {
        if (ref) {
          connect(drag(ref))
        }
      }}
      id='produtos-bento-grid'
      className={cn(
        'bg-white rounded-3xl p-4 my-16 mx-auto w-full',
        isActive ? 'ring-2 ring-blue-500' : ''
      )}
      style={{
        cursor: 'move',
        maxWidth: '100%'
      }}
    >
      {title && (
        <h2 className="text-3xl md:text-4xl font-semibold mb-8" style={{ color: 'var(--store-text-color, #000000)' }}>
          {title}
        </h2>
      )}
      <div className={cn(
        'grid gap-4 auto-rows-fr w-full md:items-start md:justify-start',
        previewMode === 'mobile' ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'
      )}>
        {renderCard(card1, 1)}
        {renderCard(card2, 2)}
        {renderCard(card3, 3)}
        {renderCard(card4, 4)}
        {renderCard(card5, 5)}
      </div>
    </section>
  )
}

ProdutosBentoGrid.craft = {
  displayName: 'Produtos BentoGrid',
  props: {
    title: '',
    backgroundColor: '#f3f4f6',
    card1: defaultCard1,
    card2: defaultCard2,
    card3: defaultCard3,
    card4: defaultCard4,
    card5: defaultCard5
  },
  related: {
    settings: ProdutosBentoGridSettings
  }
}

function ProdutosBentoGridSettings() {
  const {
    actions: { setProp },
    title,
    backgroundColor,
    card1,
    card2,
    card3,
    card4,
    card5
  } = useNode((node) => ({
    title: node.data.props.title || '',
    backgroundColor: node.data.props.backgroundColor || '#f3f4f6',
    card1: node.data.props.card1 || defaultCard1,
    card2: node.data.props.card2 || defaultCard2,
    card3: node.data.props.card3 || defaultCard3,
    card4: node.data.props.card4 || defaultCard4,
    card5: node.data.props.card5 || defaultCard5
  }))

  const { data: products } = useProducts({ limit: 100 })

  const updateCard = (cardIndex: 1 | 2 | 3 | 4 | 5, updates: Partial<BentoCard>) => {
    const cardProp = `card${cardIndex}` as keyof ProdutosBentoGridProps
    setProp((props: ProdutosBentoGridProps) => {
      const currentCard = props[cardProp] as BentoCard || {}
      props[cardProp] = { ...currentCard, ...updates } as any
    })
  }

  const CardSettings = ({ 
    card, 
    cardIndex, 
    label 
  }: { 
    card: BentoCard
    cardIndex: 1 | 2 | 3 | 4 | 5
    label: string
  }) => {
    const selectedProduct = products?.products?.find(p => p.id === card.productId)

    return (
      <div className="border border-gray-200 rounded-lg p-4 space-y-3">
        <h4 className="font-semibold text-sm mb-3">{label}</h4>
        
        <div>
          <label className="block text-xs font-medium mb-1">Habilitar Card</label>
          <input
            type="checkbox"
            checked={card.enabled === true}
            onChange={(e) => updateCard(cardIndex, { enabled: e.target.checked })}
            className="w-4 h-4"
          />
        </div>

        {card.enabled && (
          <>
            <div>
              <label className="block text-xs font-medium mb-1">Produto</label>
              <select
                value={card.productId || ''}
                onChange={(e) => {
                  const productId = e.target.value || undefined
                  updateCard(cardIndex, { productId })
                }}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md"
              >
                <option value="">Selecione um produto</option>
                {products?.products?.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedProduct && selectedProduct.main_image && (
              <div>
                <label className="block text-xs font-medium mb-1">Preview</label>
                <img 
                  src={selectedProduct.main_image} 
                  alt={selectedProduct.name}
                  className="w-full h-32 object-cover rounded"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium mb-1">Largura do Card</label>
              <select
                value={card.colSpan || 1}
                onChange={(e) => updateCard(cardIndex, { colSpan: Number(e.target.value) as 1 | 2 | 3 })}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md"
              >
                <option value={1}>1 coluna</option>
                <option value={2}>2 colunas</option>
                <option value={3}>3 colunas (largura total)</option>
              </select>
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4 p-4 max-h-[calc(100vh-200px)] overflow-y-auto">
      <div>
        <label className="block text-sm font-medium mb-2">Título do Componente</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setProp((props: ProdutosBentoGridProps) => (props.title = e.target.value))}
          placeholder="Ex: Produtos em Destaque"
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
        />
        <p className="text-xs text-gray-500 mt-1">Deixe vazio para ocultar o título</p>
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-2">Cor de Fundo dos Cards</label>
        <select
          value={backgroundColor}
          onChange={(e) =>
            setProp((props: ProdutosBentoGridProps) => (props.backgroundColor = e.target.value))
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
        >
          {ALLOWED_COLORS.map((color) => (
            <option key={color} value={color}>
              {color === '#f3f4f6' && 'Cinza Claro (Padrão)'}
              {color === '#e5e7eb' && 'Cinza Médio'}
              {color === '#d1d5db' && 'Cinza'}
              {color === '#9ca3af' && 'Cinza Escuro'}
              {color === '#ffffff' && 'Branco'}
              {color === '#000000' && 'Preto'}
              {color === '#1f2937' && 'Cinza Muito Escuro'}
              {color === '#3b82f6' && 'Azul'}
              {color === '#10b981' && 'Verde'}
              {color === '#f59e0b' && 'Laranja'}
              {color === '#ef4444' && 'Vermelho'}
              {color === '#8b5cf6' && 'Roxo'}
              {color === '#ec4899' && 'Rosa'}
              {!['#f3f4f6', '#e5e7eb', '#d1d5db', '#9ca3af', '#ffffff', '#000000', '#1f2937', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'].includes(color) && color}
            </option>
          ))}
        </select>
        <div 
          className="mt-2 w-full h-12 rounded border border-gray-300"
          style={{ backgroundColor }}
        />
      </div>
      
      <div className="space-y-4 pt-4 border-t">
        <h3 className="font-semibold text-sm">Cards do Grid</h3>
        <CardSettings card={card1} cardIndex={1} label="Card 1" />
        <CardSettings card={card2} cardIndex={2} label="Card 2" />
        <CardSettings card={card3} cardIndex={3} label="Card 3" />
        <CardSettings card={card4} cardIndex={4} label="Card 4" />
        <CardSettings card={card5} cardIndex={5} label="Card 5" />
      </div>
    </div>
  )
}
