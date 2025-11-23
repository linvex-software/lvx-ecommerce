'use client'

import { useState, useMemo, useCallback } from 'react'
import Navbar from '@/components/Navbar'
import ProductCard, { Product } from '@/components/ProductCard'
import Cart from '@/components/Cart'
import ProductFilters, { FilterState } from '@/components/ProductFilters'
import SearchBar from '@/components/SearchBar'
import Pagination from '@/components/Pagination'
import { SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'

// Enhanced Mock Products Data with sizes, colors, and stock
const MOCK_PRODUCTS: Product[] = [
  {
    id: 1,
    name: 'Camiseta Premium Oversized',
    price: 89.9,
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=500&fit=crop',
    category: 'Vestuário',
    sizes: ['P', 'M', 'G', 'GG'],
    colors: [
      { name: 'Preto', hex: '#000000' },
      { name: 'Branco', hex: '#FFFFFF' },
      { name: 'Cinza', hex: '#808080' },
    ],
    stock: 45,
    description: 'Camiseta oversized de algodão premium com corte moderno',
  },
  {
    id: 2,
    name: 'Calça Cargo Utilitária',
    price: 159.9,
    image: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=500&h=500&fit=crop',
    category: 'Vestuário',
    sizes: ['38', '40', '42', '44', '46'],
    colors: [
      { name: 'Verde Militar', hex: '#4B5320' },
      { name: 'Preto', hex: '#000000' },
      { name: 'Bege', hex: '#D2B48C' },
    ],
    stock: 28,
    description: 'Calça cargo com múltiplos bolsos e ajuste confortável',
  },
  {
    id: 3,
    name: 'Tênis Urbano Minimalista',
    price: 299.9,
    image: 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=500&h=500&fit=crop',
    category: 'Calçados',
    sizes: ['38', '39', '40', '41', '42', '43', '44'],
    colors: [
      { name: 'Branco', hex: '#FFFFFF' },
      { name: 'Preto', hex: '#000000' },
    ],
    stock: 15,
    description: 'Tênis minimalista perfeito para o dia a dia urbano',
  },
  {
    id: 4,
    name: 'Mochila Essencial 20L',
    price: 199.9,
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&h=500&fit=crop',
    category: 'Acessórios',
    sizes: ['Único'],
    colors: [
      { name: 'Preto', hex: '#000000' },
      { name: 'Cinza Carvão', hex: '#36454F' },
      { name: 'Navy', hex: '#000080' },
    ],
    stock: 32,
    description: 'Mochila compacta com compartimento para notebook',
  },
  {
    id: 5,
    name: 'Relógio Minimal Steel',
    price: 249.9,
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=500&fit=crop',
    category: 'Acessórios',
    sizes: ['Único'],
    colors: [
      { name: 'Prata', hex: '#C0C0C0' },
      { name: 'Dourado', hex: '#FFD700' },
      { name: 'Preto', hex: '#000000' },
    ],
    stock: 3,
    description: 'Relógio minimalista com design atemporal',
  },
  {
    id: 6,
    name: 'Jaqueta Bomber Premium',
    price: 349.9,
    image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&h=500&fit=crop',
    category: 'Vestuário',
    sizes: ['P', 'M', 'G', 'GG'],
    colors: [
      { name: 'Verde Oliva', hex: '#556B2F' },
      { name: 'Preto', hex: '#000000' },
      { name: 'Marinho', hex: '#001F3F' },
    ],
    stock: 12,
    description: 'Jaqueta bomber com forro acolchoado',
  },
  {
    id: 7,
    name: 'Óculos de Sol Aviador',
    price: 179.9,
    image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500&h=500&fit=crop',
    category: 'Acessórios',
    sizes: ['Único'],
    colors: [
      { name: 'Dourado', hex: '#FFD700' },
      { name: 'Prata', hex: '#C0C0C0' },
      { name: 'Preto', hex: '#000000' },
    ],
    stock: 0,
    description: 'Óculos aviador clássico com proteção UV400',
  },
  {
    id: 8,
    name: 'Boné Clássico Ajustável',
    price: 79.9,
    image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=500&h=500&fit=crop',
    category: 'Acessórios',
    sizes: ['Único'],
    colors: [
      { name: 'Preto', hex: '#000000' },
      { name: 'Branco', hex: '#FFFFFF' },
      { name: 'Navy', hex: '#000080' },
      { name: 'Bege', hex: '#D2B48C' },
    ],
    stock: 67,
    description: 'Boné clássico com ajuste traseiro',
  },
  {
    id: 9,
    name: 'Moletom Oversized',
    price: 139.9,
    image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500&h=500&fit=crop',
    category: 'Vestuário',
    sizes: ['P', 'M', 'G', 'GG', 'XG'],
    colors: [
      { name: 'Preto', hex: '#000000' },
      { name: 'Cinza Mescla', hex: '#A9A9A9' },
      { name: 'Marrom', hex: '#8B4513' },
    ],
    stock: 41,
    description: 'Moletom oversized de algodão com capuz',
  },
  {
    id: 10,
    name: 'Shorts Cargo',
    price: 119.9,
    image: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=500&h=500&fit=crop',
    category: 'Vestuário',
    sizes: ['38', '40', '42', '44'],
    colors: [
      { name: 'Cáqui', hex: '#C3B091' },
      { name: 'Preto', hex: '#000000' },
      { name: 'Verde Militar', hex: '#4B5320' },
    ],
    stock: 22,
    description: 'Shorts cargo com bolsos laterais',
  },
  {
    id: 11,
    name: 'Tênis Slip-On Canvas',
    price: 149.9,
    image: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=500&h=500&fit=crop',
    category: 'Calçados',
    sizes: ['38', '39', '40', '41', '42', '43'],
    colors: [
      { name: 'Branco', hex: '#FFFFFF' },
      { name: 'Preto', hex: '#000000' },
      { name: 'Marinho', hex: '#001F3F' },
    ],
    stock: 18,
    description: 'Tênis slip-on de lona confortável',
  },
  {
    id: 12,
    name: 'Carteira Minimalista',
    price: 89.9,
    image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=500&h=500&fit=crop',
    category: 'Acessórios',
    sizes: ['Único'],
    colors: [
      { name: 'Preto', hex: '#000000' },
      { name: 'Marrom', hex: '#8B4513' },
      { name: 'Caramelo', hex: '#C68E17' },
    ],
    stock: 54,
    description: 'Carteira slim de couro sintético',
  },
  {
    id: 13,
    name: 'Cinto de Lona',
    price: 59.9,
    image: 'https://images.unsplash.com/photo-1624222247344-550fb60583c2?w=500&h=500&fit=crop',
    category: 'Acessórios',
    sizes: ['P', 'M', 'G'],
    colors: [
      { name: 'Preto', hex: '#000000' },
      { name: 'Cáqui', hex: '#C3B091' },
      { name: 'Branco', hex: '#FFFFFF' },
    ],
    stock: 38,
    description: 'Cinto de lona com fivela metálica',
  },
  {
    id: 14,
    name: 'Bota Chelsea',
    price: 399.9,
    image: 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=500&h=500&fit=crop',
    category: 'Calçados',
    sizes: ['39', '40', '41', '42', '43', '44'],
    colors: [
      { name: 'Preto', hex: '#000000' },
      { name: 'Marrom', hex: '#8B4513' },
    ],
    stock: 8,
    description: 'Bota Chelsea de couro com elástico lateral',
  },
  {
    id: 15,
    name: 'Camisa Social Slim',
    price: 129.9,
    image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=500&h=500&fit=crop',
    category: 'Vestuário',
    sizes: ['P', 'M', 'G', 'GG'],
    colors: [
      { name: 'Branco', hex: '#FFFFFF' },
      { name: 'Azul Claro', hex: '#ADD8E6' },
      { name: 'Preto', hex: '#000000' },
    ],
    stock: 26,
    description: 'Camisa social de corte slim fit',
  },
  {
    id: 16,
    name: 'Pochete Urbana',
    price: 69.9,
    image: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=500&h=500&fit=crop',
    category: 'Acessórios',
    sizes: ['Único'],
    colors: [
      { name: 'Preto', hex: '#000000' },
      { name: 'Cinza', hex: '#808080' },
      { name: 'Verde Militar', hex: '#4B5320' },
    ],
    stock: 44,
    description: 'Pochete compacta para uso diário',
  },
]

// Available filter options
const AVAILABLE_CATEGORIES = ['Vestuário', 'Calçados', 'Acessórios']
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

  // Simulate Meilisearch filtering
  const filteredProducts = useMemo(() => {
    let filtered = [...MOCK_PRODUCTS]

    // Search filter (simulating Meilisearch fuzzy search)
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase()
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(query) ||
          product.description?.toLowerCase().includes(query) ||
          product.category.toLowerCase().includes(query)
      )
    }

    // Category filter
    if (filters.categories.length > 0) {
      filtered = filtered.filter((product) => filters.categories.includes(product.category))
    }

    // Price range filter
    filtered = filtered.filter(
      (product) => product.price >= filters.priceRange.min && product.price <= filters.priceRange.max
    )

    // Size filter
    if (filters.sizes.length > 0) {
      filtered = filtered.filter((product) =>
        product.sizes.some((size) => filters.sizes.includes(size))
      )
    }

    // Color filter
    if (filters.colors.length > 0) {
      filtered = filtered.filter((product) =>
        product.colors.some((color) => filters.colors.includes(color.name))
      )
    }

    return filtered
  }, [filters])

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE)
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [filteredProducts, currentPage])

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

  const handleRemoveItem = (id: number) => {
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
              availableCategories={AVAILABLE_CATEGORIES}
              availableSizes={AVAILABLE_SIZES}
              availableColors={AVAILABLE_COLORS}
            />
          </aside>

          {/* Products Grid */}
          <div className="lg:col-span-3">
            {/* Results Count */}
            <div className="mb-6 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {filteredProducts.length === 0 ? (
                  'Nenhum produto encontrado'
                ) : (
                  <>
                    <span className="font-semibold text-foreground">{filteredProducts.length}</span>{' '}
                    {filteredProducts.length === 1 ? 'produto encontrado' : 'produtos encontrados'}
                  </>
                )}
              </p>
            </div>

            {/* Products Grid */}
            {paginatedProducts.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {paginatedProducts.map((product) => (
                    <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} />
                  ))}
                </div>

                {/* Pagination */}
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  itemsPerPage={ITEMS_PER_PAGE}
                  totalItems={filteredProducts.length}
                />
              </>
            ) : (
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
