'use client'

import React, { useState, useMemo } from 'react'
import { useNode } from '@craftjs/core'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import Link from 'next/link'
import axios from 'axios'
import { Button } from '@white-label/ui'
import { SlidersHorizontal } from 'lucide-react'
import { ProductCardCraft, Product } from './ProductCardCraft'
import { ProductFiltersCraft, FilterState } from './ProductFiltersCraft'

interface ProductsBlockCraftProps {
  title?: string
  category_id?: string
  limit?: number
  show_filters?: boolean
  layout?: 'grid' | 'carousel'
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'

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

async function fetchAPI(path: string) {
  const storeId = process.env.NEXT_PUBLIC_STORE_ID
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (storeId) {
    headers['x-store-id'] = storeId
  }
  const response = await axios.get(`${API_URL}${path}`, { headers })
  return response.data
}

export const ProductsBlockCraft = ({
  title = 'Produtos em Destaque',
  category_id,
  limit = 8,
  show_filters = false,
  layout = 'grid',
}: ProductsBlockCraftProps) => {
  const { connectors: { connect, drag }, isSelected } = useNode((node) => ({
    isSelected: node.events.selected,
  }))

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
    queryKey: ['products-block', category_id, limit, filters],
    queryFn: () => {
      const params = new URLSearchParams()
      
      if (filters.searchQuery) params.append('q', filters.searchQuery)

      if (filters.categories.length > 0 && categoriesData) {
        const categoryIds = filters.categories
          .map(name => categoriesData.categories.find(c => c.name === name)?.id)
          .filter(Boolean) as string[]

        if (categoryIds.length > 0) {
          params.append('category_id', categoryIds[0])
        }
      } else if (category_id) {
        params.append('category_id', category_id)
      }

      if (filters.sizes.length > 0) {
        filters.sizes.forEach(size => params.append('sizes', size))
      }

      if (filters.colors.length > 0) {
        filters.colors.forEach(color => params.append('colors', color))
      }

      params.append('min_price', filters.priceRange.min.toString())
      params.append('max_price', filters.priceRange.max.toString())
      params.append('limit', limit.toString())
      params.append('page', '1')
      
      return fetchAPI(`/products?${params.toString()}`)
    },
    placeholderData: keepPreviousData
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

  const handleAddToCart = (product: Product) => {
    // Mock add to cart - em produção, isso viria de um store
    console.log('Add to cart:', product)
  }

  if (show_filters) {
    return (
      <section 
        ref={(ref: HTMLDivElement | null) => {
        if (ref) {
          connect(drag(ref))
        }
      }}
        className={`container mx-auto px-4 py-12 ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
      >
        <h2 className="text-3xl font-bold mb-8 text-center">{title}</h2>
        
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

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <aside className={`lg:block ${showFilters ? 'block' : 'hidden'}`}>
            <ProductFiltersCraft
              filters={filters}
              onFilterChange={handleFilterChange}
              availableCategories={availableCategories}
              availableSizes={AVAILABLE_SIZES}
              availableColors={AVAILABLE_COLORS}
            />
          </aside>

          <div className="lg:col-span-3">
            <div className="mb-6">
              <p className="text-sm text-muted-foreground">
                {isLoading ? 'Carregando...' : products.length === 0 ? 'Nenhum produto encontrado' : (
                  <>
                    <span className="font-semibold text-foreground">{productsData?.total}</span>{' '}
                    {productsData?.total === 1 ? 'produto encontrado' : 'produtos encontrados'}
                  </>
                )}
              </p>
            </div>

            {products.length > 0 ? (
              <div className={`grid grid-cols-1 sm:grid-cols-2 ${layout === 'grid' ? 'xl:grid-cols-3' : 'xl:grid-cols-2'} gap-6`}>
                {products.map((product) => (
                  <Link key={product.id} href={`/products/${product.slug}`} className="h-full">
                    <ProductCardCraft product={product} onAddToCart={handleAddToCart} />
                  </Link>
                ))}
              </div>
            ) : (
              !isLoading && (
                <div className="text-center py-16">
                  <p className="text-2xl font-bold mb-2">Nenhum produto encontrado</p>
                  <p className="text-muted-foreground mb-6">
                    Tente ajustar os filtros ou fazer uma nova busca
                  </p>
                </div>
              )
            )}
          </div>
        </div>
      </section>
    )
  }

  if (isLoading) {
    return (
      <section 
        ref={(ref: HTMLDivElement | null) => {
        if (ref) {
          connect(drag(ref))
        }
      }}
        className={`container mx-auto px-4 py-12 ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
      >
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
    <section 
      ref={(ref: HTMLDivElement | null) => {
        if (ref) {
          connect(drag(ref))
        }
      }}
      className={`container mx-auto px-4 py-12 ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
    >
      <h2 className="text-3xl font-bold mb-8 text-center">{title}</h2>
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${layout === 'grid' ? 'xl:grid-cols-4' : 'xl:grid-cols-3'} gap-6`}>
        {products.map((product) => (
          <Link key={product.id} href={`/products/${product.slug}`} className="h-full">
            <ProductCardCraft product={product} onAddToCart={handleAddToCart} />
          </Link>
        ))}
      </div>
    </section>
  )
}

const ProductsBlockSettings = () => {
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
          onChange={(e) => setProp((props: ProductsBlockCraftProps) => (props.title = e.target.value))}
          className="w-full px-3 py-2 border rounded"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Limite: {props.limit || 8}</label>
        <input
          type="number"
          min="1"
          max="20"
          value={props.limit || 8}
          onChange={(e) => setProp((props: ProductsBlockCraftProps) => (props.limit = parseInt(e.target.value)))}
          className="w-full px-3 py-2 border rounded"
        />
      </div>
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          checked={props.show_filters || false}
          onChange={(e) => setProp((props: ProductsBlockCraftProps) => (props.show_filters = e.target.checked))}
          className="rounded"
        />
        <label className="text-sm">Mostrar Filtros</label>
      </div>
    </div>
  )
}

ProductsBlockCraft.craft = {
  displayName: 'Lista de Produtos',
  props: {
    title: 'Produtos em Destaque',
    limit: 8,
    show_filters: false,
    layout: 'grid',
  },
  related: {
    settings: ProductsBlockSettings,
  },
}

