'use client'

import { Editor, Frame } from '@craftjs/core'
import { loadTemplateComponents } from '@/lib/templates/template-loader'
import { useEffect, useState, useMemo } from 'react'
import { Header } from '@/components/template/flor-de-menina/components/layout/Header'
import { MiniCart } from '@/components/template/flor-de-menina/components/cart/MiniCart'
import { CartProvider } from '@/components/template/flor-de-menina/components/contexts/CartContext'
import { ProductCard } from '@/components/template/flor-de-menina/components/product/ProductCard'

interface Product {
  id: string
  name: string
  slug: string
  basePrice: string
  sku: string
  status: string
  mainImage?: string | null
  main_image?: string | null // Suporte para ambos os formatos
  category_name?: string | null
  description?: string | null
  images?: string[]
  sizes?: string[]
  colors?: { name: string; hex?: string }[]
}

interface DynamicPage {
  id: string
  title: string
  slug: string
  published: boolean
  contentJson?: Record<string, unknown> | null
  products?: Array<{
    id: string
    productId: string
    orderIndex: number
    product?: Product
  }>
}

interface DynamicPageRendererProps {
  page: DynamicPage
}

export function DynamicPageRenderer({ page }: DynamicPageRendererProps) {
  const [resolver, setResolver] = useState<Record<string, any>>({})
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadComponents = async () => {
      try {
        const components = await loadTemplateComponents('flor-de-menina')
        setResolver(components)
      } catch (error) {
        console.error('Error loading template components:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadComponents()
  }, [])

  // Mapear produtos para o formato esperado pelo ProductCard
  const products = useMemo(() => {
    if (!page.products) return []
    
    return page.products
      .filter(p => p.product !== undefined)
      .sort((a, b) => a.orderIndex - b.orderIndex) // Ordenar pelo orderIndex
      .map(p => {
        const product = p.product!
        // Usar mainImage ou main_image (pode vir de diferentes formatos da API)
        const mainImage = (product as any).mainImage || (product as any).main_image || null
        return {
          id: product.id,
          slug: product.slug,
          name: product.name,
          price: parseFloat(product.basePrice || '0'),
          images: mainImage ? [mainImage] : [],
          category: product.category_name || 'Geral',
          sizes: product.sizes || [],
          colors: (product.colors || []).map(c => ({
            name: c.name,
            hex: c.hex || '#000000',
          })),
          description: product.description || '',
          isNew: false,
          isBestSeller: false,
          isFeatured: false,
        }
      })
  }, [page.products])

  const totalResults = products.length

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-500">Carregando página...</p>
        </div>
      </div>
    )
  }

  // Determinar se é uma página institucional (tem conteúdo Craft.js mas não tem produtos)
  const hasContent = page.contentJson && Object.keys(page.contentJson).length > 0
  const isInstitutionalPage = hasContent && products.length === 0

  return (
    <CartProvider>
      <div className="min-h-screen bg-background">
        <Header />
        <MiniCart />

        {/* Para páginas institucionais (com conteúdo Craft.js e sem produtos) */}
        {isInstitutionalPage && (
          <div className="w-full">
            <Editor
              resolver={resolver}
              enabled={false}
            >
              <Frame data={typeof page.contentJson === 'string' ? page.contentJson : JSON.stringify(page.contentJson)}>
                <div className="craft-render">
                  {/* O conteúdo será renderizado pelo Craft.js */}
                </div>
              </Frame>
            </Editor>
          </div>
        )}

        {/* Para páginas com produtos ou páginas mistas */}
        {!isInstitutionalPage && (
          <>
            {/* Renderizar conteúdo Craft.js se existir (antes do header de produtos) */}
            {hasContent && (
              <div className="w-full">
                <Editor
                  resolver={resolver}
                  enabled={false}
                >
                  <Frame data={typeof page.contentJson === 'string' ? page.contentJson : JSON.stringify(page.contentJson)}>
                    <div className="craft-render">
                      {/* O conteúdo será renderizado pelo Craft.js */}
                    </div>
                  </Frame>
                </Editor>
              </div>
            )}

            {/* Header - mesmo estilo da página /produtos */}
            <div className="bg-cream py-12">
              <div className="container mx-auto px-4">
                <h1 className="font-display text-4xl lg:text-5xl text-foreground mt-4">
                  {page.title}
                </h1>
                {totalResults > 0 && (
                  <p className="text-muted-foreground font-body mt-2">
                    {totalResults} produto{totalResults !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>

            {/* Products Grid - mesmo estilo da página /produtos */}
            {products.length > 0 && (
              <div className="container mx-auto px-4 py-8">
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
              </div>
            )}
          </>
        )}
      </div>
    </CartProvider>
  )
}

