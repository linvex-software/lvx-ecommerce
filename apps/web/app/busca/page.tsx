'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Search as SearchIcon, X, Filter } from 'lucide-react'
import { fetchAPI } from '@/lib/api'
import { ProductCard } from '@/components/template/flor-de-menina/components/product/ProductCard'
import { Button } from '@/components/template/flor-de-menina/components/ui/button'
import { Header } from '@/components/template/flor-de-menina/components/layout/Header'
import { cn } from '@/lib/utils'

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
  price?: number
  category?: string
}

interface ProductsResponse {
  products: ProductFromAPI[]
  total: number
  totalPages?: number
}

export default function SearchPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Inicializar estado a partir dos searchParams apenas uma vez
  const [query, setQuery] = useState(() => searchParams.get('q') || '')
  const [debouncedQuery, setDebouncedQuery] = useState(() => searchParams.get('q') || '')
  const [page, setPage] = useState(() => {
    const pageParam = searchParams.get('page')
    return pageParam ? parseInt(pageParam, 10) : 1
  })
  const [showFilters, setShowFilters] = useState(false)

  // Extrair filtros da URL uma vez
  const filtersFromUrl = useMemo(() => {
    return {
      categoryId: searchParams.get('category_id'),
      sizes: searchParams.getAll('sizes'),
      colors: searchParams.getAll('colors'),
      minPrice: searchParams.get('min_price'),
      maxPrice: searchParams.get('max_price'),
    }
  }, [
    searchParams.get('category_id'),
    searchParams.getAll('sizes').join(','),
    searchParams.getAll('colors').join(','),
    searchParams.get('min_price'),
    searchParams.get('max_price'),
  ])

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
      if (query !== debouncedQuery) {
        setPage(1) // Reset to first page when query changes
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query, debouncedQuery])

  // Update URL when debouncedQuery or page changes
  useEffect(() => {
    // Usar filtersFromUrl que já está memoizado
    const params = new URLSearchParams()
    if (debouncedQuery) {
      params.set('q', debouncedQuery)
    }
    params.set('page', page.toString())
    
    // Preservar outros parâmetros da URL (filtros)
    if (filtersFromUrl.categoryId) params.set('category_id', filtersFromUrl.categoryId)
    filtersFromUrl.sizes.forEach(size => params.append('sizes', size))
    filtersFromUrl.colors.forEach(color => params.append('colors', color))
    if (filtersFromUrl.minPrice) params.set('min_price', filtersFromUrl.minPrice)
    if (filtersFromUrl.maxPrice) params.set('max_price', filtersFromUrl.maxPrice)
    
    const newUrl = `/busca?${params.toString()}`
    const currentUrl = `/busca?${searchParams.toString()}`
    
    // Só atualizar URL se realmente mudou (evitar loops)
    if (newUrl !== currentUrl) {
      router.replace(newUrl, { scroll: false })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery, page, router, filtersFromUrl]) // Removido searchParams para evitar loops

  // Build query params for API
  const apiParams = useMemo(() => {
    const params = new URLSearchParams()
    
    if (debouncedQuery) {
      params.append('q', debouncedQuery)
    }
    
    if (filtersFromUrl.categoryId) params.append('category_id', filtersFromUrl.categoryId)
    filtersFromUrl.sizes.forEach(size => params.append('sizes', size))
    filtersFromUrl.colors.forEach(color => params.append('colors', color))
    if (filtersFromUrl.minPrice) params.append('min_price', filtersFromUrl.minPrice)
    if (filtersFromUrl.maxPrice) params.append('max_price', filtersFromUrl.maxPrice)
    
    params.append('page', page.toString())
    params.append('limit', '12')
    
    return params
  }, [debouncedQuery, page, filtersFromUrl])

  // Fetch products
  const { data, isLoading, error } = useQuery<ProductsResponse>({
    queryKey: ['search-products', apiParams.toString()],
    queryFn: async () => {
      const response = await fetchAPI(`/products?${apiParams.toString()}`)
      return response
    },
    enabled: debouncedQuery.length > 0 || searchParams.toString().length > 0,
    staleTime: 1000 * 60 * 2, // Cache por 2 minutos
    refetchOnWindowFocus: false, // Não refazer requisição ao focar na janela
  })

  const products = useMemo(() => {
    if (!data?.products) return []
    return data.products.map((p: ProductFromAPI) => ({
      id: p.id,
      slug: p.slug, // Incluir slug do produto
      name: p.name,
      price: parseFloat(p.base_price),
      images: p.main_image ? [p.main_image] : [],
      category: p.category_name || 'Geral',
      sizes: [],
      colors: [],
      description: p.description || '',
    }))
  }, [data])

  const suggestions = ['Vestido Vermelho', 'Conjunto Branco', 'Blazer', 'Natal']

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion)
    setDebouncedQuery(suggestion)
  }

  const handleClear = () => {
    setQuery('')
    setDebouncedQuery('')
    router.push('/busca')
  }

  const totalResults = data?.total || 0
  const totalPages = data?.totalPages || Math.ceil(totalResults / 12)

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        {/* Search Input */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <SearchIcon
              size={24}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="O que você está procurando?"
              className="w-full pl-14 pr-12 py-5 border border-border bg-background font-body text-lg focus:outline-none focus:ring-2 focus:ring-primary rounded-md"
              autoFocus
            />
            {query && (
              <button
                onClick={handleClear}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={20} />
              </button>
            )}
          </div>

          {/* Suggestions */}
          {!query && !debouncedQuery && (
            <div className="mt-6">
              <p className="text-sm text-muted-foreground mb-3 font-body">Sugestões de busca:</p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="px-4 py-2 bg-secondary text-sm font-body hover:bg-primary hover:text-primary-foreground transition-colors rounded-md"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        {(debouncedQuery || searchParams.toString().length > 0) && (
          <div>
            {isLoading ? (
              <div className="text-center py-16">
                <p className="text-muted-foreground font-body">Buscando produtos...</p>
              </div>
            ) : error ? (
              <div className="text-center py-16">
                <p className="text-muted-foreground font-body mb-2">
                  Erro ao buscar produtos
                </p>
                <Button onClick={() => router.refresh()} variant="outline">
                  Tentar novamente
                </Button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <p className="text-muted-foreground font-body">
                    {totalResults} resultado{totalResults !== 1 ? 's' : ''} 
                    {debouncedQuery && ` para "${debouncedQuery}"`}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-2"
                  >
                    <Filter size={16} />
                    Filtros
                  </Button>
                </div>

                {products.length === 0 ? (
                  <div className="text-center py-16">
                    <p className="text-muted-foreground font-body mb-2">
                      Nenhum produto encontrado{debouncedQuery && ` para "${debouncedQuery}"`}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Tente usar outros termos ou explore nossas categorias
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
                      {products.map((product) => (
                        <ProductCard key={product.id} product={product} />
                      ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-center gap-2 mt-8">
                        <Button
                          variant="outline"
                          onClick={() => setPage(p => Math.max(1, p - 1))}
                          disabled={page === 1}
                        >
                          Anterior
                        </Button>
                        <span className="text-sm text-muted-foreground font-body">
                          Página {page} de {totalPages}
                        </span>
                        <Button
                          variant="outline"
                          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                          disabled={page >= totalPages}
                        >
                          Próxima
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

