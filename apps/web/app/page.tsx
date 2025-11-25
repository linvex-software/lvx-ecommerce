'use client'

import { useState, useMemo, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import ProductCard, { Product } from '@/components/ProductCard'
import Cart from '@/components/Cart'
import ProductFilters, { FilterState } from '@/components/ProductFilters'
import Pagination from '@/components/Pagination'
import { SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { fetchAPI } from '@/lib/api'
import { useCartStore } from '@/lib/store/useCartStore'

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

const ITEMS_PER_PAGE = 8

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

const HomePage = () => {
  const { addItem, isOpen, openCart, items } = useCartStore()
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

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

  // Fetch Products
  const { data: productsData, isLoading } = useQuery<{ products: APIProduct[], total: number, totalPages: number }>({
    queryKey: ['products', filters, currentPage],
    queryFn: () => {
      const params = new URLSearchParams()
      if (filters.searchQuery) params.append('q', filters.searchQuery)

      // Map category names to IDs
      if (filters.categories.length > 0 && categoriesData) {
        const categoryIds = filters.categories
          .map(name => categoriesData.categories.find(c => c.name === name)?.id)
          .filter(Boolean) as string[]

        if (categoryIds.length > 0) {
          // API currently supports only one category_id filter
          params.append('category_id', categoryIds[0])
        }
      }

      // Add size filters
      if (filters.sizes.length > 0) {
        filters.sizes.forEach(size => params.append('sizes', size))
      }

      // Add color filters
      if (filters.colors.length > 0) {
        filters.colors.forEach(color => params.append('colors', color))
      }

      // Add price filters - sempre envia para garantir que o filtro funcione
      params.append('min_price', filters.priceRange.min.toString())
      params.append('max_price', filters.priceRange.max.toString())


      params.append('page', currentPage.toString())
      params.append('limit', ITEMS_PER_PAGE.toString())

      const url = `/products?${params.toString()}`

      return fetchAPI(url)
    }
  })

  // Map API products to UI products
  const products: (Product & { slug: string })[] = useMemo(() => {
    if (!productsData?.products) return []
    return productsData.products.map(p => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: parseFloat(p.base_price),
      image: p.main_image || 'https://via.placeholder.com/500', // Fallback image
      category: p.category_name || 'Geral',
      sizes: [], // Not available in API list yet
      colors: [], // Not available in API list yet
      stock: 10, // Mock stock
      description: p.description || ''
    }))
  }, [productsData])

  // Reset to page 1 when filters change
  const handleFilterChange = useCallback((newFilters: FilterState) => {
    setFilters(newFilters)
    setCurrentPage(1)
  }, [])

  const handleSearch = useCallback((query: string) => {
    setFilters((prev) => ({ ...prev, searchQuery: query }))
    setCurrentPage(1)
  }, [])

  const handleAddToCart = (product: Product) => {
    addItem(product)
    openCart()
  }

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <div className="min-h-screen bg-background">
      <Navbar cartCount={totalItems} onCartClick={openCart} onSearch={handleSearch} />

      {/* Hero Section - Banner */}
      <div className="w-full  mb-8 sm:mb-12 relative overflow-hidden flex items-center justify-center bg-muted -mt-px">
        {/* Banner image */}
        <div className="w-full h-full flex items-center justify-center">
          <img
            src="https://marketplace.canva.com/EAFRp91MQHk/1/0/1600w/canva-banner-oferta-de-black-week-fashion-branco-preto-e-verde-gtpHK3FGwQE.jpg"
            alt="Banner Principal"
            className="w-full h-full object-cover object-center"
          />
        </div>
        {/* Gradient overlay - fade from bottom to top */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent pointer-events-none"></div>
      </div>

      <main className="container mx-auto px-4 pb-12">
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
                {isLoading ? (
                  'Carregando...'
                ) : products.length === 0 ? (
                  'Nenhum produto encontrado'
                ) : (
                  <>
                    <span className="font-semibold text-foreground">{productsData?.total}</span>{' '}
                    {productsData?.total === 1 ? 'produto encontrado' : 'produtos encontrados'}
                  </>
                )}
              </p>
            </div>

            {/* Products Grid */}
            {products.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {products.map((product) => (
                    <Link key={product.id} href={`/products/${product.slug}`}>
                      <ProductCard product={product} onAddToCart={handleAddToCart} />
                    </Link>
                  ))}
                </div>

                {/* Pagination */}
                <Pagination
                  currentPage={currentPage}
                  totalPages={productsData?.totalPages || 1}
                  onPageChange={setCurrentPage}
                  itemsPerPage={ITEMS_PER_PAGE}
                  totalItems={productsData?.total || 0}
                />
              </>
            ) : (
              !isLoading && (
                <div className="text-center py-16">
                  <p className="text-2xl font-bold mb-2">Nenhum produto encontrado</p>
                  <p className="text-muted-foreground mb-6">
                    Tente ajustar os filtros ou fazer uma nova busca
                  </p>
                  <Button onClick={() => handleFilterChange({
                    categories: [],
                    priceRange: { min: 0, max: 1000 },
                    sizes: [],
                    colors: [],
                    searchQuery: '',
                  })}>
                    Limpar todos os filtros
                  </Button>
                </div>
              )
            )}
          </div>
        </div>
      </main>

      {isOpen && (
        <Cart />
      )}
    </div>
  )
}

export default HomePage
