'use client'

import { useNode } from '@craftjs/core'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { useAuthStore } from '@/store/auth-store'
import { ProductCardCraft } from '@/components/editor/craft-blocks/ProductCardCraft'

interface Product {
  id: string
  name: string
  slug: string
  basePrice: string
  sku: string
  status: string
  mainImage?: string | null
}

interface SelectedProductsBlockProps {
  pageId?: string
  pageSlug?: string
}

export function SelectedProductsBlock({ pageId, pageSlug }: SelectedProductsBlockProps) {
  const { connectors: { connect, drag } } = useNode()
  const user = useAuthStore((state) => state.user)

  // Buscar página com produtos
  const { data: pageData, isLoading } = useQuery<{
    page: {
      id: string
      products?: Array<{
        productId: string
        product?: Product
      }>
    }
  }>({
    queryKey: ['dynamic-page-products', pageId || pageSlug],
    queryFn: async () => {
      if (pageId) {
        const response = await apiClient.get(`/admin/dynamic-pages/${pageId}`)
        return response.data
      } else if (pageSlug) {
        const response = await apiClient.get(`/admin/dynamic-pages`)
        const pages = response.data.pages || []
        const page = pages.find((p: any) => p.slug === pageSlug)
        if (page) {
          const pageResponse = await apiClient.get(`/admin/dynamic-pages/${page.id}`)
          return pageResponse.data
        }
      }
      throw new Error('Page not found')
    },
    enabled: !!(pageId || pageSlug) && !!user?.storeId,
  })

  const products = pageData?.page?.products
    ?.map(p => p.product)
    .filter((p): p is Product => p !== undefined) || []

  if (isLoading) {
    return (
      <div
        ref={(ref) => {
          if (ref) {
            connect(drag(ref))
          }
        }}
        className="p-8"
      >
        <div className="text-center">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-text-secondary">Carregando produtos...</p>
        </div>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div
        ref={(ref) => {
          if (ref) {
            connect(drag(ref))
          }
        }}
        className="p-8 text-center"
      >
        <p className="text-sm text-text-secondary">
          Nenhum produto selecionado nesta página
        </p>
        <p className="text-xs text-text-tertiary mt-1">
          Selecione produtos nas configurações da página
        </p>
      </div>
    )
  }

  return (
    <div
      ref={(ref) => {
        if (ref) {
          connect(drag(ref))
        }
      }}
      className="p-8"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCardCraft
            key={product.id}
            product={{
              id: product.id,
              name: product.name,
              slug: product.slug,
              base_price: product.basePrice,
              main_image: product.mainImage || null,
            } as any}
            onAddToCart={() => {}}
          />
        ))}
      </div>
    </div>
  )
}

SelectedProductsBlock.craft = {
  displayName: 'Produtos Selecionados',
  props: {
    pageId: '',
    pageSlug: '',
  },
}

