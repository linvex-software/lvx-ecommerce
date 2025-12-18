'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ProductCard } from './product-card'
import ProductFilters, { type FilterState } from '@/components/ProductFilters'
import { fetchAPI } from '@/lib/api'

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

interface Product {
  id: string
  name: string
  base_price: string
  main_image?: string | null
  slug: string
  category_name?: string
  stock?: {
    current_stock: number
  }
}

interface Category {
  id: string
  name: string
  slug: string
}

// Valores disponíveis para filtros (estáticos por enquanto)
const AVAILABLE_SIZES = ['P', 'M', 'G', 'GG', 'XG', '38', '39', '40', '41', '42', '43', '44', '46', 'Único']
const AVAILABLE_COLORS = [
  { name: 'Preto', hex: '#000000' },
  { name: 'Branco', hex: '#FFFFFF' },
  { name: 'Cinza', hex: '#808080' },
  { name: 'Marrom', hex: '#8B4513' },
  { name: 'Bege', hex: '#D2B48C' },
  { name: 'Verde Militar', hex: '#4B5320' },
  { name: 'Navy', hex: '#000080' },
  { name: 'Dourado', hex: '#FFD700' },
  { name: 'Prata', hex: '#C0C0C0' },
]

export function ProductGrid({
  title = 'Produtos em Destaque',
  productsCount = 4,
  columns = 4,
  borderRadius = 8,
  padding = 24,
  margin = 0,
  backgroundColor = '#ffffff',
  textColor = '#000000',
  showFilters = false
}: ProductGridProps) {
  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    priceRange: { min: 0, max: 1000 },
    sizes: [],
    colors: [],
    searchQuery: '',
  })

  // Buscar categorias apenas se os filtros estiverem ativos
  const { data: categoriesData } = useQuery<{ categories: Category[] }>({
    queryKey: ['categories'],
    queryFn: () => fetchAPI('/categories'),
    enabled: showFilters // Só busca se os filtros estiverem ativos
  })

  const availableCategories = useMemo(() => {
    return categoriesData?.categories.map(c => c.name) || []
  }, [categoriesData])

  // Buscar produtos (com ou sem filtros dependendo de showFilters)
  const { data: productsData, isLoading } = useQuery<{ products: Product[], total?: number }>({
    queryKey: ['products', 'editor-grid', productsCount, showFilters ? filters : null, categoriesData, showFilters],
    queryFn: async () => {
      const params = new URLSearchParams()
      
      // Aplicar filtros apenas se showFilters estiver ativo
      if (showFilters) {
        // Aplicar filtros
        if (filters.searchQuery) params.append('q', filters.searchQuery)

        // Mapear nomes de categorias para IDs
        if (filters.categories.length > 0 && categoriesData) {
          const categoryIds = filters.categories
            .map(name => categoriesData.categories.find(c => c.name === name)?.id)
            .filter(Boolean) as string[]

          if (categoryIds.length > 0) {
            params.append('category_id', categoryIds[0])
          }
        }

        // Adicionar filtros de tamanho
        if (filters.sizes.length > 0) {
          filters.sizes.forEach(size => params.append('sizes', size))
        }

        // Adicionar filtros de cor
        if (filters.colors.length > 0) {
          filters.colors.forEach(color => params.append('colors', color))
        }

        // Adicionar filtros de preço
        params.append('min_price', filters.priceRange.min.toString())
        params.append('max_price', filters.priceRange.max.toString())
      }

      params.append('limit', productsCount.toString())
      params.append('page', '1')
      
      return fetchAPI(`/products?${params.toString()}`) as Promise<{ products: Product[], total?: number }>
    }
  })

  const products: Product[] = productsData?.products || []

  const gridCols =
    columns === 1
      ? 'grid-cols-1'
      : columns === 2
        ? 'grid-cols-2'
        : columns === 3
          ? 'grid-cols-3'
          : 'grid-cols-4'

  const containerStyle = {
    backgroundColor: ALLOWED_COLORS.includes(backgroundColor)
      ? backgroundColor
      : ALLOWED_COLORS[0],
    color: ALLOWED_COLORS.includes(textColor) ? textColor : ALLOWED_COLORS[1],
    borderRadius: `${borderRadius}px`,
    padding: `${padding}px`,    
    margin: `${margin}px 0`
  }

  return (
    <div style={containerStyle}>
      {title && (
        <h2 className="text-2xl font-bold mb-6 text-center" style={{ color: 'var(--store-text-color, #000000)' }}>{title}</h2>
      )}

      {/* Layout com ou sem filtros */}
      {showFilters ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar de Filtros */}
          <aside className="lg:col-span-1">
            <ProductFilters
              filters={filters}
              onFilterChange={setFilters}
              availableCategories={availableCategories}
              availableSizes={AVAILABLE_SIZES}
              availableColors={AVAILABLE_COLORS}
            />
          </aside>

          {/* Grade de Produtos */}
          <div className="lg:col-span-3">
            {isLoading ? (
              <div className={`grid ${gridCols} gap-4`}>
                {Array.from({ length: productsCount }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-gray-200 aspect-square rounded-lg mb-4" />
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                  </div>
                ))}
              </div>
            ) : products.length > 0 ? (
              <>
                <div className="mb-4 text-sm opacity-75">
                  {productsData?.total !== undefined && (
                    <>
                      <span className="font-semibold">{productsData.total}</span>{' '}
                      {productsData.total === 1 ? 'produto encontrado' : 'produtos encontrados'}
                    </>
                  )}
                </div>
                <div className={`grid ${gridCols} gap-4`}>
                  {products.map((product) => (
                    <ProductCard
                      key={product.id}
                      id={product.id}
                      name={product.name}
                      price={product.base_price}
                      image={product.main_image || ''}
                      slug={product.slug}
                      stock={product.stock?.current_stock}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-8 opacity-75">
                <p className="text-lg font-semibold mb-2">Nenhum produto encontrado</p>
                <p className="text-sm">
                  Tente ajustar os filtros
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        // Grade de produtos sem filtros (layout original)
        <>
          {isLoading ? (
            <div className={`grid ${gridCols} gap-4`}>
              {Array.from({ length: productsCount }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 aspect-square rounded-lg mb-4" />
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                </div>
              ))}
            </div>
          ) : (
            <div className={`grid ${gridCols} gap-4`}>
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  price={product.base_price}
                  image={product.main_image || ''}
                  slug={product.slug}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

