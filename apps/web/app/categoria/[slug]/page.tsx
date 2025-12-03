'use client'

import { useQuery } from '@tanstack/react-query'
import { useParams, notFound, useRouter } from 'next/navigation'
import { fetchAPI } from '@/lib/api'
import Navbar from '@/components/Navbar'
import { useCartStore } from '@/lib/store/useCartStore'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import ProductCard, { type Product as ProductCardType } from '@/components/ProductCard'
import { useState } from 'react'

interface Category {
  id: string
  name: string
  slug: string
  icon?: string | null
}

interface Product {
  id: string
  name: string
  base_price: string
  main_image?: string | null
  slug: string
  category_name?: string | null
  description?: string | null
  stock?: {
    current_stock: number
  }
}

interface CategoryResponse {
  category: Category
}

interface ProductsResponse {
  products: Product[]
  total: number
}

export default function CategoryPage() {
  const params = useParams()
  const slug = params.slug as string
  const router = useRouter()
  const { items, addItem } = useCartStore()
  const [page, setPage] = useState(1)
  const limit = 12

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)

  const handleAddToCart = (product: ProductCardType) => {
    addItem(product)
  }

  // Buscar categoria por slug
  const { data: categoryData, isLoading: isLoadingCategory, error: categoryError } = useQuery<CategoryResponse>({
    queryKey: ['category', slug],
    queryFn: async () => {
      try {
        const response = await fetchAPI(`/categories/slug/${slug}`)
        return response
      } catch (err) {
        if (err instanceof Error && 'status' in err && (err as { status?: number }).status === 404) {
          notFound()
        }
        throw err
      }
    },
    retry: 1,
  })

  const category = categoryData?.category

  // Buscar produtos da categoria
  const { data: productsData, isLoading: isLoadingProducts } = useQuery<ProductsResponse>({
    queryKey: ['category-products', category?.id, page],
    queryFn: async () => {
      if (!category?.id) return { products: [], total: 0 }
      const response = await fetchAPI(`/products?category_id=${category.id}&page=${page}&limit=${limit}`)
      return response
    },
    enabled: !!category?.id,
    retry: 1,
  })

  if (isLoadingCategory) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar cartCount={0} onCartClick={() => router.push('/carrinho')} onSearch={() => {}} />
        <main className="mx-auto w-full max-w-6xl px-4 py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-muted w-48 rounded"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-square bg-muted rounded"></div>
                  <div className="mt-4 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (categoryError || !category) {
    notFound()
  }

  const products = productsData?.products || []
  const total = productsData?.total || 0
  const totalPages = Math.ceil(total / limit)

  return (
    <div className="min-h-screen bg-background">
      <Navbar cartCount={totalItems} onCartClick={() => router.push('/carrinho')} onSearch={() => {}} />

      <main className="mx-auto w-full max-w-6xl px-4 py-8">
        {/* Botão Voltar */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para a loja</span>
        </Link>

        {/* Título da Categoria */}
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold mb-2">{category.name}</h1>
          {total > 0 && (
            <p className="text-muted-foreground">
              {total} {total === 1 ? 'produto encontrado' : 'produtos encontrados'}
            </p>
          )}
        </div>

        {/* Listagem de Produtos */}
        {isLoadingProducts ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-square bg-muted rounded-lg mb-4"></div>
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : products.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {products.map((product) => {
                const productForCard: ProductCardType = {
                  id: product.id,
                  name: product.name,
                  price: parseFloat(product.base_price),
                  image: product.main_image || 'https://via.placeholder.com/500',
                  category: product.category_name || category.name,
                  description: product.description || '',
                  stock: product.stock?.current_stock ?? 0,
                }
                return (
                  <Link key={product.id} href={`/products/${product.slug}`}>
                    <ProductCard product={productForCard} onAddToCart={handleAddToCart} />
                  </Link>
                )
              })}
            </div>

            {/* Paginação */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border border-border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted transition-colors"
                >
                  Anterior
                </button>
                <span className="px-4 py-2 text-sm text-muted-foreground">
                  Página {page} de {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 border border-border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted transition-colors"
                >
                  Próxima
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16">
            <p className="text-lg font-semibold mb-2 text-muted-foreground">
              Nenhum produto encontrado nesta categoria
            </p>
            <Link
              href="/"
              className="text-primary hover:underline inline-flex items-center gap-2 mt-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar para a loja
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}

