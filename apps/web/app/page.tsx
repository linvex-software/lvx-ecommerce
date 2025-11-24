'use client'

import { useState, useMemo, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import Navbar from '@/components/Navbar'
import ProductCard, { Product } from '@/components/ProductCard'
import Cart from '@/components/Cart'
import ProductFilters, { FilterState } from '@/components/ProductFilters'
import SearchBar from '@/components/SearchBar'
import Pagination from '@/components/Pagination'
import { SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { fetchAPI } from '@/lib/api'

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

interface CartItem extends Product {
  quantity: number
}

const ITEMS_PER_PAGE = 8

interface APIProduct {
  id: string
  name: string
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
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
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
  const products: Product[] = useMemo(() => {
    if (!productsData?.products) return []
    return productsData.products.map(p => ({
      id: p.id,
      name: p.name,
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
    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === product.id)
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      }
      return [...prev, { ...product, quantity: 1 }]
    })
  }

  const handleRemoveItem = (id: number | string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id))
  }

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <div className="min-h-screen bg-background">
      <Navbar cartCount={totalItems} onCartClick={() => setIsCartOpen(true)} />

      <main className="container mx-auto px-4 py-12">
        {/* Header Section */}
        <div className="mb-8">
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold mb-4 tracking-tight">Coleção Essencial</h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Produtos minimalistas de alta qualidade para o seu dia a dia
            </p>
          </div>

          {/* Search Bar */}
          <div className="flex justify-center mb-6">
            <SearchBar onSearch={handleSearch} />
          </div>

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
                    <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} />
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

      {isCartOpen && (
        <Cart items={cartItems} onClose={() => setIsCartOpen(false)} onRemoveItem={handleRemoveItem} />
      )}
    </div>
  )
}

export default HomePage
