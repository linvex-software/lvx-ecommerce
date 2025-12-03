'use client'

import { useNode } from '@craftjs/core'
import { ProductCard } from './product-card'

interface ProductGridProps {
  title?: string
  productsCount?: number
  columns?: number
  borderRadius?: number
  padding?: number
  margin?: number
  backgroundColor?: string
  textColor?: string
  showFilters?: boolean
}

const ALLOWED_COLORS = [
  '#ffffff',
  '#000000',
  '#f3f4f6',
  '#1f2937',
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444'
]

export function ProductGrid({
  title = 'Produtos em Destaque',
  productsCount = 4,
  columns = 4,
  borderRadius = 8,
  padding = 24,
  margin = 0,
  backgroundColor = '#ffffff',
  textColor = '#000000'
}: ProductGridProps) {
  const {
    connectors: { connect, drag },
    isActive
  } = useNode((state) => ({
    isActive: state.events.selected
  }))

  // Mock products para preview no editor
  const mockProducts = Array.from({ length: productsCount }, (_, i) => ({
    id: `mock-${i}`,
    name: `Produto ${i + 1}`,
    price: '99.90',
    image: '',
    slug: `produto-${i + 1}`
  }))

  const gridCols = columns === 1 ? 'grid-cols-1' : columns === 2 ? 'grid-cols-2' : columns === 3 ? 'grid-cols-3' : 'grid-cols-4'

  return (
    <div
      ref={(ref) => {
        if (ref) {
          connect(drag(ref))
        }
      }}
      className={`${isActive ? 'ring-2 ring-blue-500' : ''}`}
      style={{
        backgroundColor: ALLOWED_COLORS.includes(backgroundColor)
          ? backgroundColor
          : ALLOWED_COLORS[0],
        color: ALLOWED_COLORS.includes(textColor) ? textColor : ALLOWED_COLORS[1],
        borderRadius: `${borderRadius}px`,
        padding: `${padding}px`,
        margin: `${margin}px 0`
      }}
    >
      {title && (
        <h2 className="text-2xl font-bold mb-6 text-center" style={{ color: 'var(--store-text-color, #000000)' }}>{title}</h2>
      )}
      <div className={`grid ${gridCols} gap-4`}>
        {mockProducts.map((product) => (
          <ProductCard
            key={product.id}
            id={product.id}
            name={product.name}
            price={product.price}
            image={product.image}
            slug={product.slug}
          />
        ))}
      </div>
    </div>
  )
}

ProductGrid.craft = {
  displayName: 'Grade de Produtos',
  props: {
    title: 'Produtos em Destaque',
    productsCount: 4,
    columns: 4,
    borderRadius: 8,
    padding: 24,
    margin: 0,
    backgroundColor: '#ffffff',
    textColor: '#000000',
    showFilters: false
  },
  related: {
    settings: ProductGridSettings
  }
}

function ProductGridSettings() {
  const {
    actions: { setProp },
    title,
    productsCount,
    columns,
    borderRadius,
    padding,
    margin,
    backgroundColor,
    textColor,
    showFilters
  } = useNode((node) => ({
    title: node.data.props.title || 'Produtos em Destaque',
    productsCount: node.data.props.productsCount ?? 4,
    columns: node.data.props.columns ?? 4,
    borderRadius: node.data.props.borderRadius ?? 8,
    padding: node.data.props.padding ?? 24,
    margin: node.data.props.margin ?? 0,
    backgroundColor: node.data.props.backgroundColor || '#ffffff',
    textColor: node.data.props.textColor || '#000000',
    showFilters: node.data.props.showFilters ?? false
  }))

  return (
    <div className="space-y-4 p-4">
      <div>
        <label className="block text-sm font-medium mb-1">Título</label>
        <input
          type="text"
          value={title}
          onChange={(e) =>
            setProp((props: ProductGridProps) => (props.title = e.target.value))
          }
          className="w-full px-3 py-2 border rounded-md"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Quantidade de Produtos: {productsCount}
        </label>
        <input
          type="range"
          min={1}
          max={12}
          value={productsCount}
          onChange={(e) =>
            setProp(
              (props: ProductGridProps) =>
                (props.productsCount = Number(e.target.value))
            )
          }
          className="w-full"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Colunas</label>
        <select
          value={columns}
          onChange={(e) =>
            setProp(
              (props: ProductGridProps) =>
                (props.columns = Number(e.target.value))
            )
          }
          className="w-full px-3 py-2 border rounded-md"
        >
          <option value={1}>1</option>
          <option value={2}>2</option>
          <option value={3}>3</option>
          <option value={4}>4</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Cor de Fundo
        </label>
        <select
          value={backgroundColor}
          onChange={(e) =>
            setProp(
              (props: ProductGridProps) =>
                (props.backgroundColor = e.target.value)
            )
          }
          className="w-full px-3 py-2 border rounded-md"
        >
          {ALLOWED_COLORS.map((color) => (
            <option key={color} value={color}>
              {color}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Cor do Texto</label>
        <select
          value={textColor}
          onChange={(e) =>
            setProp(
              (props: ProductGridProps) => (props.textColor = e.target.value)
            )
          }
          className="w-full px-3 py-2 border rounded-md"
        >
          {ALLOWED_COLORS.map((color) => (
            <option key={color} value={color}>
              {color}
            </option>
          ))}
        </select>
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
              (props: ProductGridProps) =>
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
              (props: ProductGridProps) => (props.padding = Number(e.target.value))
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
              (props: ProductGridProps) => (props.margin = Number(e.target.value))
            )
          }
          className="w-full"
        />
      </div>

      <div className="flex items-center space-x-2 pt-4 border-t">
        <input
          type="checkbox"
          id="showFilters"
          checked={showFilters}
          onChange={(e) =>
            setProp(
              (props: ProductGridProps) => (props.showFilters = e.target.checked)
            )
          }
          className="w-4 h-4"
        />
        <label htmlFor="showFilters" className="text-sm font-medium cursor-pointer">
          Mostrar Filtros
        </label>
      </div>
    </div>
  )
}

