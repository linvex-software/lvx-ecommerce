'use client'

import { useNode, useEditor } from '@craftjs/core'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { ProductCard } from './product-card'
import { ColorConfig } from '@/components/editor/settings/types'
import { getColorWithOpacity } from '@/components/editor/settings/utils'
import { TextField, ColorSettingsField, SpacingField } from '@/components/editor/settings'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Product {
  id: string
  name: string
  base_price: string
  main_image?: string | null
  slug: string
  category_name?: string
}

interface ProductSectionProps {
  title?: string
  viewAllText?: string
  viewAllLink?: string
  productsCount?: number
  showNavigation?: boolean
  backgroundColor?: string | ColorConfig
  textColor?: string | ColorConfig
  useThemeTextColor?: boolean
  useThemeBackgroundColor?: boolean
  padding?: number
  gap?: number
}

export function ProductSection({
  title = 'OS IMPRESCINDÍVEIS DA PRIMAVERA',
  viewAllText = 'Ver Todos',
  viewAllLink = '/produtos',
  productsCount = 4,
  showNavigation = true,
  backgroundColor: backgroundColorProp = '#FAFAFA',
  textColor: textColorProp = '#000000',
  useThemeTextColor = false,
  useThemeBackgroundColor = false,
  padding = 60,
  gap = 20
}: ProductSectionProps) {
  // Resolver cores
  const backgroundColor = useThemeBackgroundColor
    ? 'var(--store-background-color, #FAFAFA)'
    : typeof backgroundColorProp === 'object'
    ? getColorWithOpacity(backgroundColorProp)
    : backgroundColorProp

  const textColor = useThemeTextColor
    ? 'var(--store-text-color, #000000)'
    : typeof textColorProp === 'object'
    ? getColorWithOpacity(textColorProp)
    : textColorProp
  const {
    connectors: { connect, drag },
    isActive
  } = useNode((state) => ({
    isActive: state.events.selected
  }))

  const { enabled } = useEditor((state) => ({
    enabled: state.options.enabled
  }))

  // Mock products para preview no editor
  const products: Product[] = Array.from({ length: productsCount }, (_, i) => ({
    id: `mock-${i}`,
    name: `Cotton cable-knit short-sleeve POLO ${i + 1}`,
    base_price: '5400.00',
    main_image: null,
    slug: `produto-${i + 1}`,
    category_name: 'Regular Woodland'
  }))

  return (
    <div
      ref={(ref) => {
        if (ref) {
          connect(drag(ref))
        }
      }}
      className={`relative w-full ${isActive ? 'ring-2 ring-blue-500' : ''}`}
      style={{
        cursor: enabled ? 'move' : 'default',
        backgroundColor,
        padding: `100px ${padding}px`
      }}
    >
      <div
        className="flex flex-col gap-8"
        style={{
          gap: '32px'
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between"
          style={{
            maxWidth: '1287px'
          }}
        >
          <div className="flex items-center gap-6">
            <h2
              className="text-3xl font-normal"
              style={{
                fontFamily: 'Montserrat, sans-serif',
                fontSize: '32px',
                lineHeight: '1.25em',
                color: textColor
              }}
            >
              {title}
            </h2>
            {viewAllText && (
              <Link
                href={viewAllLink}
                className="text-base hover:opacity-70 transition-opacity"
                style={{
                  fontFamily: 'Roboto, sans-serif',
                  fontSize: '16px',
                  lineHeight: '1.5em',
                  color: textColor
                }}
              >
                {viewAllText}
              </Link>
            )}
          </div>

          {/* Navigation Arrows */}
          {showNavigation && (
            <div className="flex items-center gap-[18px]">
              <button
                className="p-3 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Previous"
              >
                <ChevronLeft className="w-6 h-6" style={{ color: textColor }} />
              </button>
              <button
                className="p-3 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Next"
              >
                <ChevronRight className="w-6 h-6" style={{ color: textColor }} />
              </button>
            </div>
          )}
        </div>

        {/* Products Grid */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
          style={{
            gap: `${gap}px`
          }}
        >
          {products.length > 0 ? (
            products.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                price={product.base_price}
                image={product.main_image || ''}
                slug={product.slug}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-8 opacity-75">
              <p style={{ color: textColor }}>Nenhum produto encontrado</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

ProductSection.craft = {
  displayName: 'Product Section',
  props: {
    title: 'THE SPRING MUST-HAVES',
    viewAllText: 'View All',
    viewAllLink: '#',
    productsCount: 4,
    showNavigation: true,
    backgroundColor: '#FAFAFA',
    textColor: '#000000',
    useThemeTextColor: false,
    useThemeBackgroundColor: false,
    padding: 60,
    gap: 20
  },
  related: {
    settings: ProductSectionSettings
  }
}

function ProductSectionSettings() {
  const {
    actions: { setProp },
    title,
    viewAllText,
    viewAllLink,
    productsCount,
    showNavigation,
    backgroundColor,
    textColor,
    useThemeTextColor,
    useThemeBackgroundColor,
    padding,
    gap
  } = useNode((node) => ({
    title: node.data.props.title || 'THE SPRING MUST-HAVES',
    viewAllText: node.data.props.viewAllText || 'View All',
    viewAllLink: node.data.props.viewAllLink || '#',
    productsCount: node.data.props.productsCount || 4,
    showNavigation: node.data.props.showNavigation ?? true,
    backgroundColor: node.data.props.backgroundColor || '#FAFAFA',
    textColor: node.data.props.textColor || '#000000',
    useThemeTextColor: node.data.props.useThemeTextColor ?? false,
    useThemeBackgroundColor: node.data.props.useThemeBackgroundColor ?? false,
    padding: node.data.props.padding || 60,
    gap: node.data.props.gap || 20
  }))

  // Converter string para ColorConfig se necessário
  const textColorConfig: ColorConfig = typeof textColor === 'object' && 'type' in textColor
    ? textColor
    : { type: 'custom', value: textColor as string }

  const backgroundColorConfig: ColorConfig = typeof backgroundColor === 'object' && 'type' in backgroundColor
    ? backgroundColor
    : { type: 'custom', value: backgroundColor as string }

  return (
    <div className="space-y-4 p-4">
      <TextField
        label="Título"
        value={title}
        onChange={(value) => setProp((props: ProductSectionProps) => (props.title = value))}
      />
      
      <TextField
        label='Texto "Ver Todos"'
        value={viewAllText}
        onChange={(value) => setProp((props: ProductSectionProps) => (props.viewAllText = value))}
      />
      
      <TextField
        label='Link "Ver Todos"'
        value={viewAllLink}
        onChange={(value) => setProp((props: ProductSectionProps) => (props.viewAllLink = value))}
        type="url"
      />
      
      <div>
        <Label className="text-sm font-medium mb-2 block">Quantidade de Produtos</Label>
        <Input
          type="number"
          value={productsCount}
          onChange={(e) => setProp((props: ProductSectionProps) => (props.productsCount = parseInt(e.target.value) || 4))}
          className="h-9"
          min="1"
          max="20"
        />
      </div>
      
      <div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={showNavigation}
            onChange={(e) => setProp((props: ProductSectionProps) => (props.showNavigation = e.target.checked))}
          />
          <span className="text-sm">Mostrar navegação</span>
        </label>
      </div>

      <ColorSettingsField
        label="Cor de Fundo"
        value={backgroundColor}
        useTheme={useThemeBackgroundColor}
        onValueChange={(value) => setProp((props: ProductSectionProps) => (props.backgroundColor = value))}
        onUseThemeChange={(useTheme) => setProp((props: ProductSectionProps) => (props.useThemeBackgroundColor = useTheme))}
      />

      <ColorSettingsField
        label="Cor do Texto"
        value={textColor}
        useTheme={useThemeTextColor}
        onValueChange={(value) => setProp((props: ProductSectionProps) => (props.textColor = value))}
        onUseThemeChange={(useTheme) => setProp((props: ProductSectionProps) => (props.useThemeTextColor = useTheme))}
      />

      <SpacingField
        label="Padding"
        value={{ padding }}
        onChange={(value) => setProp((props: ProductSectionProps) => (props.padding = typeof value.padding === 'number' ? value.padding : 60))}
        type="padding"
      />
      
      <div>
        <Label className="text-sm font-medium mb-2 block">Gap entre produtos (px)</Label>
        <Input
          type="number"
          value={gap}
          onChange={(e) => setProp((props: ProductSectionProps) => (props.gap = parseInt(e.target.value) || 20))}
          className="h-9"
          min="0"
        />
      </div>
    </div>
  )
}

