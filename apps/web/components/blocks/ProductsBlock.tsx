'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { fetchAPI } from '@/lib/api'
import ProductCard, { Product } from '@/components/ProductCard'
import ProductFilters, { FilterState } from '@/components/ProductFilters'
import { useCartStore } from '@/lib/store/useCartStore'
import { Button } from '@/components/ui/button'
import { SlidersHorizontal } from 'lucide-react'
import type { ProductsBlockProps } from './types'

interface APIProduct {
  id: string
  name: string
  slug: string
  base_price: string
  main_image: string | null
  description: string | null
  category_name?: string
}

interface Category {
  id: string
  name: string
  slug: string
}

// Available filter options (Static for now as API doesn't provide them yet)
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

export function ProductsBlock({
  title = 'Produtos em Destaque',
  category_id,
  limit = 8,
  show_filters = false,
  layout = 'grid'
}: ProductsBlockProps) {
  const { addItem } = useCartStore()
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    priceRange: { min: 0, max: 1000 },
    sizes: [],
    colors: [],
    searchQuery: '',
  })

  // Fetch Categories
  const { data: categoriesData } = useQuery<{ categories: Category[] }>({
    queryKey: ['categories'],
    queryFn: () => fetchAPI('/categories')
  })

  const availableCategories = useMemo(() => {
    return categoriesData?.categories.map(c => c.name) || []
  }, [categoriesData])

  const { data: productsData, isLoading } = useQuery<{ products: APIProduct[], total: number, totalPages: number }>({
    queryKey: ['products-block', category_id, limit, filters, categoriesData],
    queryFn: () => {
      const params = new URLSearchParams()
      
      // Apply filters
      if (filters.searchQuery) params.append('q', filters.searchQuery)

      // Map category names to IDs
      if (filters.categories.length > 0 && categoriesData) {
        const categoryIds = filters.categories
          .map(name => categoriesData.categories.find(c => c.name === name)?.id)
          .filter(Boolean) as string[]

        if (categoryIds.length > 0) {
          params.append('category_id', categoryIds[0])
        }
      } else if (category_id) {
        // Use block's category_id if no filter is selected
        params.append('category_id', category_id)
      }

      // Add size filters
      if (filters.sizes.length > 0) {
        filters.sizes.forEach(size => params.append('sizes', size))
      }

      // Add color filters
      if (filters.colors.length > 0) {
        filters.colors.forEach(color => params.append('colors', color))
      }

      // Add price filters
      params.append('min_price', filters.priceRange.min.toString())
      params.append('max_price', filters.priceRange.max.toString())

      params.append('limit', limit.toString())
      params.append('page', '1')
      
      return fetchAPI(`/products?${params.toString()}`)
    },
    keepPreviousData: true
  })

  const products: (Product & { slug: string })[] = (productsData?.products || []).map(p => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: parseFloat(p.base_price),
    image: p.main_image || 'https://via.placeholder.com/500',
    category: p.category_name || 'Geral',
    sizes: [],
    colors: [],
    stock: 10,
    description: p.description || ''
  }))

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters)
  }

  // Se show_filters estiver ativo, renderizar com filtros
  if (show_filters) {
    if (isLoading) {
      return (
        <section className="container mx-auto px-4 py-12">
          <h2 className="text-3xl font-bold mb-8 text-center">{title}</h2>
          
          {/* Mobile Filter Toggle */}
          <div className="lg:hidden mb-6">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="w-full border-2"
            >
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
            </Button>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Filters Sidebar */}
            <aside className={`lg:block ${showFilters ? 'block' : 'hidden'}`}>
              <ProductFilters
                filters={filters}
                onFilterChange={handleFilterChange}
                availableCategories={availableCategories}
                availableSizes={AVAILABLE_SIZES}
                availableColors={AVAILABLE_COLORS}
              />
            </aside>

            {/* Products Grid - Loading */}
            <div className="lg:col-span-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-secondary/50 aspect-square rounded-lg mb-4" />
                    <div className="h-4 bg-secondary/50 rounded w-3/4" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )
    }
    return (
      <section className="container mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold mb-8 text-center">{title}</h2>
        
        {/* Mobile Filter Toggle */}
        <div className="lg:hidden mb-6">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="w-full border-2"
          >
            <SlidersHorizontal className="w-4 h-4 mr-2" />
            {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
          </Button>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <aside className={`lg:block ${showFilters ? 'block' : 'hidden'}`}>
            <ProductFilters
              filters={filters}
              onFilterChange={handleFilterChange}
              availableCategories={availableCategories}
              availableSizes={AVAILABLE_SIZES}
              availableColors={AVAILABLE_COLORS}
            />
          </aside>

          {/* Products Grid */}
          <div className="lg:col-span-3">
            {/* Results Count */}
            <div className="mb-6 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {productsData?.total !== undefined ? (
                  <>
                    <span className="font-semibold text-foreground">{productsData.total}</span>{' '}
                    {productsData.total === 1 ? 'produto encontrado' : 'produtos encontrados'}
                  </>
                ) : (
                  'Carregando...'
                )}
              </p>
            </div>

            {/* Products Grid */}
            {products.length > 0 ? (
              <div className={`grid grid-cols-1 sm:grid-cols-2 ${layout === 'grid' ? 'xl:grid-cols-3' : 'xl:grid-cols-2'} gap-6`}>
                {products.map((product) => (
                  <Link key={product.id} href={`/products/${product.slug}`} className="h-full">
                    <ProductCard product={product} onAddToCart={addItem} />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <p className="text-2xl font-bold mb-2">Nenhum produto encontrado</p>
                <p className="text-muted-foreground mb-6">
                  Tente ajustar os filtros ou fazer uma nova busca
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    )
  }

  // Renderização padrão sem filtros
  if (isLoading) {
    return (
      <section className="container mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold mb-8 text-center">{title}</h2>
        <div className={`grid grid-cols-1 sm:grid-cols-2 ${layout === 'grid' ? 'xl:grid-cols-4' : 'xl:grid-cols-3'} gap-6`}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-secondary/50 aspect-square rounded-lg mb-4" />
              <div className="h-4 bg-secondary/50 rounded w-3/4" />
            </div>
          ))}
        </div>
      </section>
    )
  }

  if (products.length === 0) {
    return null
  }

  return (
    <section className="container mx-auto px-4 py-12">
      <h2 className="text-3xl font-bold mb-8 text-center">{title}</h2>
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${layout === 'grid' ? 'xl:grid-cols-4' : 'xl:grid-cols-3'} gap-6`}>
        {products.map((product) => (
          <Link key={product.id} href={`/products/${product.slug}`} className="h-full">
            <ProductCard product={product} onAddToCart={addItem} />
          </Link>
        ))}
      </div>
    </section>
  )
}

