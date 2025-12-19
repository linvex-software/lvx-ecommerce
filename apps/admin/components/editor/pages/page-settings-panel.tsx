'use client'

import { useState, useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@white-label/ui'
import { apiClient } from '@/lib/api-client'
import { Search, X, Check } from 'lucide-react'

interface Product {
  id: string
  name: string
  slug: string
  base_price: string
  sku: string
  status: string
  main_image?: string | null
}

interface DynamicPage {
  id: string
  title: string
  slug: string
  published: boolean
  products?: Array<{
    id: string
    productId: string
    orderIndex: number
    product?: Product
  }>
}

interface PageSettingsPanelProps {
  page: DynamicPage
  onUpdate: (page: Partial<DynamicPage>) => void
}

export function PageSettingsPanel({ page, onUpdate }: PageSettingsPanelProps) {
  const [title, setTitle] = useState(page.title)
  const [slug, setSlug] = useState(page.slug)
  const [published, setPublished] = useState(page.published)
  const [searchQuery, setSearchQuery] = useState('')
  const [showProductSelector, setShowProductSelector] = useState(false)

  // Buscar produtos
  const { data: productsData, isLoading: isLoadingProducts } = useQuery<{
    products: Product[]
    total: number
  }>({
    queryKey: ['products', searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (searchQuery) {
        params.append('q', searchQuery)
      }
      params.append('limit', '50')
      const response = await apiClient.get(`/admin/products?${params.toString()}`)
      return response.data
    },
    enabled: showProductSelector,
  })

  const selectedProductIds = useMemo(() => {
    return page.products?.map(p => p.productId) || []
  }, [page.products])

  const selectedProducts = useMemo(() => {
    return page.products?.map(p => p.product) || []
  }, [page.products])

  useEffect(() => {
    setTitle(page.title)
    setSlug(page.slug)
    setPublished(page.published)
  }, [page])

  const handleTitleChange = (value: string) => {
    setTitle(value)
    // Gerar slug automaticamente se estiver vazio
    if (!slug) {
      const autoSlug = value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
      setSlug(autoSlug)
      onUpdate({ title: value, slug: autoSlug })
    } else {
      onUpdate({ title: value })
    }
  }

  const handleSlugChange = (value: string) => {
    // Validar slug (apenas letras minúsculas, números e hífens)
    // Permitir hífens, mas remover caracteres inválidos e hífens duplicados
    let validSlug = value.toLowerCase()
    
    // Remover caracteres inválidos (mantendo letras, números e hífens)
    validSlug = validSlug.replace(/[^a-z0-9-]/g, '')
    
    // Remover hífens duplicados
    validSlug = validSlug.replace(/-+/g, '-')
    
    // Remover hífens no início e fim
    validSlug = validSlug.replace(/^-+|-+$/g, '')
    
    setSlug(validSlug)
    onUpdate({ slug: validSlug })
  }

  const handleToggleProduct = (productId: string) => {
    const currentIds = selectedProductIds
    const isSelected = currentIds.includes(productId)

    let newProducts: DynamicPage['products']
    if (isSelected) {
      // Remover produto
      newProducts = page.products?.filter(p => p.productId !== productId) || []
    } else {
      // Adicionar produto
      const product = productsData?.products.find(p => p.id === productId)
      if (product) {
        // Mapear produto da API para o formato esperado
        const mappedProduct: Product = {
          id: product.id,
          name: product.name,
          slug: product.slug,
          base_price: (product as any).base_price || (product as any).basePrice || '0',
          sku: product.sku,
          status: product.status,
          main_image: (product as any).main_image || (product as any).mainImage || null,
        }
        newProducts = [
          ...(page.products || []),
          {
            id: `temp-${Date.now()}`,
            productId: product.id,
            orderIndex: page.products?.length || 0,
            product: mappedProduct
          }
        ]
      } else {
        newProducts = page.products
      }
    }

    onUpdate({ products: newProducts })
  }

  const handleRemoveProduct = (productId: string) => {
    const newProducts = page.products?.filter(p => p.productId !== productId) || []
    onUpdate({ products: newProducts })
  }

  const availableProducts = productsData?.products || []

  return (
    <div className="h-full flex flex-col">
      <div className="border-b border-gray-200 px-4 py-3">
        <h3 className="text-sm font-semibold text-gray-900">Configurações da Página</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Básico */}
        <div className="space-y-4">
          <h4 className="text-xs font-semibold text-gray-500 uppercase">Básico</h4>
          
          <div>
            <Label>Título</Label>
            <Input
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Ex: Queima de Estoque"
            />
          </div>

          <div>
            <Label>Slug (URL)</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">/</span>
              <Input
                value={slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="queima-de-estoque"
                className="flex-1"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Apenas letras minúsculas, números e hífens
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="published"
              checked={published}
              onChange={(e) => {
                setPublished(e.target.checked)
                onUpdate({ published: e.target.checked })
              }}
              className="rounded border-gray-300"
            />
            <Label htmlFor="published" className="cursor-pointer">
              Publicada
            </Label>
          </div>
        </div>

        {/* Produtos */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-gray-500 uppercase">Produtos</h4>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowProductSelector(!showProductSelector)}
            >
              {showProductSelector ? 'Fechar' : 'Selecionar'}
            </Button>
          </div>

          {/* Produtos selecionados */}
          {selectedProducts.length > 0 && (
            <div className="space-y-2">
              {selectedProducts.map((product) => (
                product && (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {product.name}
                      </p>
                      <p className="text-xs text-gray-500">SKU: {product.sku}</p>
                    </div>
                    <button
                      onClick={() => handleRemoveProduct(product.id)}
                      className="ml-2 text-gray-400 hover:text-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )
              ))}
            </div>
          )}

          {/* Seletor de produtos */}
          {showProductSelector && (
            <div className="border border-gray-200 rounded-lg p-4 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar produtos..."
                  className="pl-9"
                />
              </div>

              {isLoadingProducts ? (
                <div className="text-center py-4">
                  <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {availableProducts.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                      Nenhum produto encontrado
                    </p>
                  ) : (
                    availableProducts.map((product) => {
                      const isSelected = selectedProductIds.includes(product.id)
                      return (
                        <button
                          key={product.id}
                          onClick={() => handleToggleProduct(product.id)}
                          className={`w-full text-left p-2 rounded border transition-colors ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {product.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                R$ {product.base_price ? parseFloat(product.base_price).toFixed(2) : '0.00'}
                              </p>
                            </div>
                            {isSelected && (
                              <Check className="h-4 w-4 text-blue-600 flex-shrink-0 ml-2" />
                            )}
                          </div>
                        </button>
                      )
                    })
                  )}
                </div>
              )}
            </div>
          )}

          {selectedProducts.length === 0 && !showProductSelector && (
            <p className="text-sm text-gray-500 text-center py-4">
              Nenhum produto selecionado
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

