'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { SlidersHorizontal } from 'lucide-react'
import { fetchAPI } from '@/lib/api'
import { ProductCard } from '@/components/template/flor-de-menina/components/product/ProductCard'
import { Header } from '@/components/template/flor-de-menina/components/layout/Header'
import { Button } from '@/components/template/flor-de-menina/components/ui/button'
import { FiltersModal } from '@/components/products/FiltersModal'

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
            onClick={() => setIsFilterOpen(true)}
            className="flex items-center gap-2 text-sm font-body tracking-wide uppercase hover:text-primary transition-colors"
          >
            <SlidersHorizontal size={18} />
            Filtros
            {hasActiveFilters && (
              <span className="w-5 h-5 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center">
                {filtersFromUrl.sizes.length + filtersFromUrl.colors.length + (effectiveCategoryId ? 1 : 0) + (filtersFromUrl.minPrice ? 1 : 0) + (filtersFromUrl.maxPrice ? 1 : 0)}
              </span>
            )}
          </button>

          {/* Sort */}
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm text-muted-foreground hidden sm:block">Ordenar por:</span>
            <select
              value={filtersFromUrl.sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
              className="bg-transparent border border-border px-4 py-2 text-sm font-body focus:outline-none focus:ring-1 focus:ring-primary rounded-md"
            >
              <option value="newest">Mais Recentes</option>
              <option value="price-asc">Menor Preço</option>
              <option value="price-desc">Maior Preço</option>
              <option value="name">Nome A-Z</option>
            </select>
          </div>
        </div>

        {/* Products Grid */}
        <div className="w-full">
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

        {/* Filters Modal */}
        <FiltersModal
          open={isFilterOpen}
          onOpenChange={setIsFilterOpen}
          categories={categories}
          effectiveCategoryId={effectiveCategoryId}
          filtersFromUrl={filtersFromUrl}
          availableSizes={AVAILABLE_SIZES}
          availableColors={AVAILABLE_COLORS}
          onToggleCategory={toggleCategory}
          onToggleSize={toggleSize}
          onToggleColor={toggleColor}
          onUpdatePriceRange={updatePriceRange}
          onClearFilters={clearFilters}
          onApplyFilters={() => {
            // Os filtros já são aplicados automaticamente via URL params
            // Este handler apenas fecha o modal
          }}
          hasActiveFilters={hasActiveFilters}
          totalResults={totalResults}
        />
      </div>
    </div>
  )
}

