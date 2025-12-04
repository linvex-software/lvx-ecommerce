'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { SlidersHorizontal, X, ChevronDown, ChevronUp } from 'lucide-react'
import { fetchAPI } from '@/lib/api'
import { ProductCard } from '@/components/template/flor-de-menina/components/product/ProductCard'
import { Header } from '@/components/template/flor-de-menina/components/layout/Header'
import { Button } from '@/components/template/flor-de-menina/components/ui/button'
import { cn } from '@/lib/utils'

interface Category {
  id: string
  name: string
  slug: string
}

interface ProductFromAPI {
  id: string
  name: string
  slug: string
  base_price: string
  main_image?: string | null
  category_name?: string | null
  description?: string | null
  images?: string[]
  sizes?: string[]
  colors?: { name: string; hex?: string }[]
}

interface ProductsResponse {
  products: ProductFromAPI[]
  total: number
  totalPages?: number
}

interface CategoriesResponse {
  categories: Category[]
}

// Valores disponíveis para filtros
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

export default function ProductsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [expandedSections, setExpandedSections] = useState({
    category: true,
    price: true,
    size: true,
    color: true,
  })

  // Extrair filtros da URL
  const filtersFromUrl = useMemo(() => {
    return {
      categoryId: searchParams.get('category_id'),
      category: searchParams.get('category'),
      filter: searchParams.get('filter'),
      sizes: searchParams.getAll('sizes'),
      colors: searchParams.getAll('colors'),
      minPrice: searchParams.get('min_price'),
      maxPrice: searchParams.get('max_price'),
      sortBy: searchParams.get('sort') || 'newest',
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!, 10) : 1,
    }
  }, [searchParams])

  // Buscar categorias
  const { data: categoriesData } = useQuery<CategoriesResponse>({
    queryKey: ['categories'],
    queryFn: () => fetchAPI('/categories'),
  })

  const categories = categoriesData?.categories || []

  // Converter slug de categoria para category_id se necessário
  const effectiveCategoryId = useMemo(() => {
    if (filtersFromUrl.categoryId) return filtersFromUrl.categoryId
    if (filtersFromUrl.category) {
      const category = categories.find(c => c.slug === filtersFromUrl.category)
      return category?.id
    }
    return null
  }, [filtersFromUrl.categoryId, filtersFromUrl.category, categories])

  // Atualizar URL se category (slug) foi usado e precisamos converter para category_id
  useEffect(() => {
    if (filtersFromUrl.category && effectiveCategoryId && !filtersFromUrl.categoryId) {
      const params = new URLSearchParams(searchParams.toString())
      params.delete('category')
      params.set('category_id', effectiveCategoryId)
      router.replace(`/produtos?${params.toString()}`, { scroll: false })
    }
  }, [filtersFromUrl.category, effectiveCategoryId, filtersFromUrl.categoryId, searchParams, router])

  // Build query params for API
  const apiParams = useMemo(() => {
    const params = new URLSearchParams()
    
    if (effectiveCategoryId) params.append('category_id', effectiveCategoryId)
    filtersFromUrl.sizes.forEach(size => params.append('sizes', size))
    filtersFromUrl.colors.forEach(color => params.append('colors', color))
    if (filtersFromUrl.minPrice) params.append('min_price', filtersFromUrl.minPrice)
    if (filtersFromUrl.maxPrice) params.append('max_price', filtersFromUrl.maxPrice)
    
    params.append('page', filtersFromUrl.page.toString())
    params.append('limit', '12')
    
    return params
  }, [effectiveCategoryId, filtersFromUrl.sizes, filtersFromUrl.colors, filtersFromUrl.minPrice, filtersFromUrl.maxPrice, filtersFromUrl.page])

  // Fetch products
  const { data, isLoading, error } = useQuery<ProductsResponse>({
    queryKey: ['products', apiParams.toString()],
    queryFn: async () => {
      const response = await fetchAPI(`/products?${apiParams.toString()}`)
      return response
    },
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
  })

  const products = useMemo(() => {
    if (!data?.products) return []
    let mapped = data.products.map((p: ProductFromAPI) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      price: parseFloat(p.base_price),
      images: p.main_image ? [p.main_image] : [],
      category: p.category_name || 'Geral',
      sizes: p.sizes || [],
      colors: (p.colors || []).map(c => ({
        name: c.name,
        hex: c.hex || '#000000', // Fallback para preto se não tiver hex
      })),
      description: p.description || '',
      isNew: false,
      isBestSeller: false,
      isFeatured: false,
    }))

    // Aplicar ordenação no frontend
    switch (filtersFromUrl.sortBy) {
      case 'price-asc':
        mapped.sort((a, b) => a.price - b.price)
        break
      case 'price-desc':
        mapped.sort((a, b) => b.price - a.price)
        break
      case 'name':
        mapped.sort((a, b) => a.name.localeCompare(b.name))
        break
      case 'newest':
      default:
        // Manter ordem original (mais recentes primeiro)
        break
    }

    return mapped
  }, [data, filtersFromUrl.sortBy])

  const totalResults = data?.total || 0
  const totalPages = data?.totalPages || Math.ceil(totalResults / 12)

  // Determinar título da página
  const pageTitle = useMemo(() => {
    if (filtersFromUrl.filter === 'new') return 'Novidades'
    if (filtersFromUrl.filter === 'bestseller') return 'Mais Vendidos'
    if (filtersFromUrl.filter === 'featured') return 'Looks de Festa'
    if (effectiveCategoryId) {
      const category = categories.find(c => c.id === effectiveCategoryId)
      return category?.name || 'Produtos'
    }
    return 'Todos os Produtos'
  }, [filtersFromUrl.filter, effectiveCategoryId, categories])

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  const updateFilters = (updates: Partial<typeof filtersFromUrl>) => {
    const params = new URLSearchParams()
    
    const newFilters = { ...filtersFromUrl, ...updates, page: 1 }
    
    if (newFilters.categoryId) params.set('category_id', newFilters.categoryId)
    if (newFilters.category) params.set('category', newFilters.category)
    if (newFilters.filter) params.set('filter', newFilters.filter)
    newFilters.sizes.forEach(size => params.append('sizes', size))
    newFilters.colors.forEach(color => params.append('colors', color))
    if (newFilters.minPrice) params.set('min_price', newFilters.minPrice)
    if (newFilters.maxPrice) params.set('max_price', newFilters.maxPrice)
    if (newFilters.sortBy && newFilters.sortBy !== 'newest') params.set('sort', newFilters.sortBy)
    
    router.push(`/produtos?${params.toString()}`)
  }

  const toggleSize = (size: string) => {
    const newSizes = filtersFromUrl.sizes.includes(size)
      ? filtersFromUrl.sizes.filter(s => s !== size)
      : [...filtersFromUrl.sizes, size]
    updateFilters({ sizes: newSizes })
  }

  const toggleColor = (color: string) => {
    const newColors = filtersFromUrl.colors.includes(color)
      ? filtersFromUrl.colors.filter(c => c !== color)
      : [...filtersFromUrl.colors, color]
    updateFilters({ colors: newColors })
  }

  const toggleCategory = (categoryId: string) => {
    updateFilters({ categoryId: effectiveCategoryId === categoryId ? undefined : categoryId })
  }

  const updatePriceRange = (type: 'min' | 'max', value: string) => {
    updateFilters({ [type === 'min' ? 'minPrice' : 'maxPrice']: value || undefined })
  }

  const clearFilters = () => {
    router.push('/produtos')
  }

  const hasActiveFilters = 
    effectiveCategoryId ||
    filtersFromUrl.sizes.length > 0 ||
    filtersFromUrl.colors.length > 0 ||
    filtersFromUrl.minPrice ||
    filtersFromUrl.maxPrice

  const handleSortChange = (sortBy: string) => {
    updateFilters({ sortBy })
  }

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', newPage.toString())
    router.push(`/produtos?${params.toString()}`)
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Header */}
      <div className="bg-cream py-12">
        <div className="container mx-auto px-4">
          <h1 className="font-display text-4xl lg:text-5xl text-foreground mt-4">{pageTitle}</h1>
          <p className="text-muted-foreground font-body mt-2">
            {totalResults} produto{totalResults !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="flex items-center gap-2 text-sm font-body tracking-wide uppercase hover:text-primary transition-colors lg:hidden"
          >
            <SlidersHorizontal size={18} />
            Filtros
            {hasActiveFilters && (
              <span className="w-5 h-5 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center">
                {filtersFromUrl.sizes.length + filtersFromUrl.colors.length + (effectiveCategoryId ? 1 : 0)}
              </span>
            )}
          </button>

          {/* Sort */}
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm text-muted-foreground hidden sm:block">Ordenar por:</span>
            <select
              value={filtersFromUrl.sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
              className="bg-transparent border border-border px-4 py-2 text-sm font-body focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="newest">Mais Recentes</option>
              <option value="price-asc">Menor Preço</option>
              <option value="price-desc">Maior Preço</option>
              <option value="name">Nome A-Z</option>
            </select>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Filters Sidebar */}
          <aside
            className={cn(
              "fixed lg:static inset-0 z-50 lg:z-0 bg-background lg:bg-transparent w-full lg:w-64 flex-shrink-0 transition-transform duration-300 lg:transform-none",
              isFilterOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
            )}
          >
            <div className="h-full lg:h-auto overflow-y-auto p-6 lg:p-0">
              {/* Mobile Header */}
              <div className="flex items-center justify-between mb-6 lg:hidden">
                <h3 className="font-display text-xl">Filtros</h3>
                <button onClick={() => setIsFilterOpen(false)}>
                  <X size={24} />
                </button>
              </div>

              {/* Categories */}
              <div className="mb-8">
                <button
                  onClick={() => toggleSection('category')}
                  className="flex items-center justify-between w-full text-left mb-4"
                >
                  <h4 className="font-display text-lg">Categorias</h4>
                  {expandedSections.category ? (
                    <ChevronUp size={18} />
                  ) : (
                    <ChevronDown size={18} />
                  )}
                </button>
                {expandedSections.category && (
                  <ul className="space-y-2">
                    <li>
                      <button
                        onClick={() => toggleCategory('')}
                        className={cn(
                          "w-full text-left text-sm font-body py-1 hover:text-primary transition-colors",
                          !effectiveCategoryId ? "text-primary font-medium" : "text-muted-foreground"
                        )}
                      >
                        Todas as categorias
                      </button>
                    </li>
                    {categories.map((cat) => (
                      <li key={cat.id}>
                        <button
                          onClick={() => toggleCategory(cat.id)}
                          className={cn(
                            "w-full text-left text-sm font-body py-1 hover:text-primary transition-colors",
                            effectiveCategoryId === cat.id ? "text-primary font-medium" : "text-muted-foreground"
                          )}
                        >
                          {cat.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Price Range */}
              <div className="mb-8">
                <button
                  onClick={() => toggleSection('price')}
                  className="flex items-center justify-between w-full text-left mb-4"
                >
                  <h4 className="font-display text-lg">Preço</h4>
                  {expandedSections.price ? (
                    <ChevronUp size={18} />
                  ) : (
                    <ChevronDown size={18} />
                  )}
                </button>
                {expandedSections.price && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs text-muted-foreground">Mínimo</label>
                      <input
                        type="number"
                        min="0"
                        value={filtersFromUrl.minPrice || ''}
                        onChange={(e) => updatePriceRange('min', e.target.value)}
                        placeholder="R$ 0"
                        className="w-full border border-border px-3 py-2 text-sm font-body focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-muted-foreground">Máximo</label>
                      <input
                        type="number"
                        min="0"
                        value={filtersFromUrl.maxPrice || ''}
                        onChange={(e) => updatePriceRange('max', e.target.value)}
                        placeholder="R$ 1000"
                        className="w-full border border-border px-3 py-2 text-sm font-body focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Sizes */}
              <div className="mb-8">
                <button
                  onClick={() => toggleSection('size')}
                  className="flex items-center justify-between w-full text-left mb-4"
                >
                  <h4 className="font-display text-lg">Tamanho</h4>
                  {expandedSections.size ? (
                    <ChevronUp size={18} />
                  ) : (
                    <ChevronDown size={18} />
                  )}
                </button>
                {expandedSections.size && (
                  <div className="flex flex-wrap gap-2">
                    {AVAILABLE_SIZES.map((size) => (
                      <button
                        key={size}
                        onClick={() => toggleSize(size)}
                        className={cn(
                          "w-10 h-10 border text-sm font-body transition-colors",
                          filtersFromUrl.sizes.includes(size)
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border hover:border-primary"
                        )}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Colors */}
              <div className="mb-8">
                <button
                  onClick={() => toggleSection('color')}
                  className="flex items-center justify-between w-full text-left mb-4"
                >
                  <h4 className="font-display text-lg">Cor</h4>
                  {expandedSections.color ? (
                    <ChevronUp size={18} />
                  ) : (
                    <ChevronDown size={18} />
                  )}
                </button>
                {expandedSections.color && (
                  <div className="flex flex-wrap gap-3">
                    {AVAILABLE_COLORS.map((color) => (
                      <button
                        key={color.name}
                        onClick={() => toggleColor(color.name)}
                        className={cn(
                          "w-8 h-8 rounded-full border-2 transition-all",
                          filtersFromUrl.colors.includes(color.name)
                            ? "ring-2 ring-primary ring-offset-2"
                            : "border-border hover:border-primary"
                        )}
                        style={{ backgroundColor: color.hex }}
                        title={color.name}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <Button variant="outline" onClick={clearFilters} className="w-full">
                  Limpar Filtros
                </Button>
              )}

              {/* Mobile Apply */}
              <div className="lg:hidden mt-8">
                <Button onClick={() => setIsFilterOpen(false)} className="w-full">
                  Ver {totalResults} Produto{totalResults !== 1 ? 's' : ''}
                </Button>
              </div>
            </div>
          </aside>

          {/* Products Grid */}
          <div className="flex-1">
            {isLoading ? (
              <div className="text-center py-16">
                <p className="text-muted-foreground font-body">Carregando produtos...</p>
              </div>
            ) : error ? (
              <div className="text-center py-16">
                <p className="text-muted-foreground font-body mb-2">
                  Erro ao carregar produtos
                </p>
                <Button onClick={() => router.refresh()} variant="outline">
                  Tentar novamente
                </Button>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-muted-foreground font-body mb-4">
                  Nenhum produto encontrado com os filtros selecionados.
                </p>
                {hasActiveFilters && (
                  <Button variant="outline" onClick={clearFilters}>
                    Limpar Filtros
                  </Button>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-8">
                  {products.map((product, index) => (
                    <div
                      key={product.id}
                      className="animate-fade-up"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <ProductCard product={product} />
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(filtersFromUrl.page - 1)}
                      disabled={filtersFromUrl.page === 1}
                    >
                      Anterior
                    </Button>
                    <span className="text-sm text-muted-foreground font-body px-4">
                      Página {filtersFromUrl.page} de {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(filtersFromUrl.page + 1)}
                      disabled={filtersFromUrl.page >= totalPages}
                    >
                      Próxima
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

