'use client'

import { useQuery } from '@tanstack/react-query'
import { useParams, notFound, useRouter } from 'next/navigation'
import { fetchAPI } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import Navbar from '@/components/Navbar'
import { useCartStore } from '@/lib/store/useCartStore'
import { useState } from 'react'
import { ArrowLeft, ShoppingCart } from 'lucide-react'
import Link from 'next/link'
import SizeChart from '@/components/SizeChart'
import VirtualTryOn from '@/components/VirtualTryOn'
import ProductCard from '@/components/ProductCard'

// Types baseados na resposta da API
interface ProductImage {
  id: string
  store_id: string
  product_id: string
  image_url: string
  position: number
  is_main: boolean
}

interface ProductVariant {
  id: string
  store_id: string
  product_id: string
  sku: string | null
  size: string | null
  color: string | null
  barcode: string | null
  price_override: string | null
  active: boolean
}

interface ProductCategory {
  id: string
  name: string
  slug: string
}

interface ProductWithRelations {
  id: string
  store_id: string
  name: string
  slug: string
  description: string | null
  base_price: string
  sku: string
  status: string
  virtual_model_url: string | null
  virtual_provider: string | null
  virtual_config_json: Record<string, unknown> | null
  main_image: string | null
  category_name?: string | null
  created_at: string
  updated_at: string
  variants: ProductVariant[]
  images: ProductImage[]
  categories: ProductCategory[]
  seo: {
    id: string
    store_id: string
    product_id: string
    meta_title: string | null
    meta_description: string | null
    meta_keywords: string | null
    open_graph_image: string | null
    created_at: string
    updated_at: string
  } | null
  size_chart: {
    id: string
    store_id: string
    product_id: string
    name: string
    chart_json: Record<string, unknown>
    created_at: string
    updated_at: string
  } | null
  stock: {
    current_stock: number
  }
}

interface ProductResponse {
  product: ProductWithRelations
}

export default function ProductDetailPage() {
  const params = useParams()
  const slug = params.slug as string
  const router = useRouter()
  const { addItem, items } = useCartStore()
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)

  const { data, isLoading, error } = useQuery<ProductResponse>({
    queryKey: ['product', slug],
    queryFn: async () => {
      try {
        const response = await fetchAPI(`/products/${slug}`)
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar cartCount={0} onCartClick={() => router.push('/carrinho')} onSearch={() => {}} />
        <main className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-muted w-48 rounded"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="aspect-square bg-muted rounded"></div>
              <div className="space-y-4">
                <div className="h-8 bg-muted w-3/4 rounded"></div>
                <div className="h-6 bg-muted w-1/2 rounded"></div>
                <div className="h-32 bg-muted rounded"></div>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (error || !data?.product) {
    notFound()
  }

  const product = data.product

  // Ordenar imagens por position, com is_main primeiro
  const sortedImages = [...product.images].sort((a, b) => {
    if (a.is_main) return -1
    if (b.is_main) return 1
    return a.position - b.position
  })

  // Imagem principal (pode ser alterada ao clicar nas thumbnails)
  const currentMainImage = selectedImageIndex === 0
    ? (sortedImages[0]?.image_url || product.main_image || 'https://via.placeholder.com/800')
    : sortedImages[selectedImageIndex]?.image_url || sortedImages[0]?.image_url || product.main_image || 'https://via.placeholder.com/800'

  // Preparar lista de todas as imagens para thumbnails
  const allImages: ProductImage[] = sortedImages.length > 0
    ? sortedImages
    : product.main_image
      ? [{
          image_url: product.main_image,
          id: 'main',
          store_id: product.store_id,
          product_id: product.id,
          is_main: true,
          position: 0
        }]
      : []

  const price = parseFloat(product.base_price)
  const currentStock = product.stock?.current_stock ?? 0
  const isOutOfStock = currentStock === 0

  // Preparar produto para o carrinho (formato esperado pelo useCartStore)
  const cartProduct = {
    id: product.id,
    name: product.name,
    price: price,
    image: currentMainImage,
    category: product.categories[0]?.name || product.category_name || 'Geral',
    description: product.description || '',
  }

  const handleAddToCart = () => {
    if (isOutOfStock) {
      return // Não adiciona ao carrinho se estiver esgotado
    }
    addItem(cartProduct)
    router.push('/carrinho')
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar cartCount={totalItems} onCartClick={() => router.push('/carrinho')} onSearch={() => {}} />

      <main className="container mx-auto px-4 py-8">
        {/* Botão Voltar */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para a loja</span>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Galeria de Imagens */}
          <div className="space-y-4">
            {/* Imagem Principal */}
            <Card className="overflow-hidden border border-border">
              <div className="aspect-square relative bg-secondary">
                <img
                  src={currentMainImage}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </Card>

            {/* Thumbnails das outras imagens */}
            {allImages.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {allImages.map((image, index) => (
                  <button
                    key={image.id || `image-${index}`}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`aspect-square relative overflow-hidden rounded border-2 transition-all ${
                      selectedImageIndex === index
                        ? 'border-foreground'
                        : 'border-border hover:border-foreground/50'
                    }`}
                  >
                    <img
                      src={image.image_url}
                      alt={`${product.name} - Imagem ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Informações do Produto */}
          <div className="space-y-6">
            {/* Categoria */}
            {product.categories.length > 0 && (
              <p className="text-sm text-muted-foreground uppercase tracking-wider">
                {product.categories[0].name}
              </p>
            )}

            {/* Nome */}
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-3xl lg:text-4xl font-bold flex-1">{product.name}</h1>
              {isOutOfStock && (
                <div className="px-3 py-1 bg-destructive text-destructive-foreground text-sm font-bold uppercase tracking-wider rounded">
                  Esgotado
                </div>
              )}
            </div>

            {/* Preço */}
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold">R$ {price.toFixed(2)}</span>
            </div>

            {/* Estoque */}
            {!isOutOfStock && (
              <p className="text-sm text-muted-foreground">
                Estoque: <span className="font-semibold text-foreground">{currentStock} unidades</span>
              </p>
            )}

            {/* Descrição */}
            {product.description && (
              <div className="prose prose-sm max-w-none">
                <p className="text-muted-foreground whitespace-pre-line">
                  {product.description}
                </p>
              </div>
            )}

            {/* Variantes (se houver) */}
            {product.variants.length > 0 && (
              <div className="space-y-4 pt-4 border-t border-border">
                <h3 className="font-semibold text-lg">Variações disponíveis</h3>
                <div className="flex flex-wrap gap-2">
                  {product.variants
                    .filter((v) => v.active)
                    .map((variant) => (
                      <div
                        key={variant.id}
                        className="px-3 py-1 border border-border rounded text-sm"
                      >
                        {variant.size && <span>Tamanho: {variant.size}</span>}
                        {variant.size && variant.color && <span> • </span>}
                        {variant.color && <span>Cor: {variant.color}</span>}
                        {variant.price_override && (
                          <span className="ml-2 text-muted-foreground">
                            (R$ {parseFloat(variant.price_override).toFixed(2)})
                          </span>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Botão Descobrir meu tamanho */}
            {product.size_chart && (
              <div className="pt-4">
                <VirtualTryOn
                  virtualModelUrl={product.virtual_model_url}
                  virtualProvider={product.virtual_provider}
                  virtualConfigJson={product.virtual_config_json}
                  productName={product.name}
                  sizeChart={product.size_chart}
                />
              </div>
            )}

            {/* Botão Adicionar ao Carrinho */}
            <div className="pt-4">
              <Button
                onClick={handleAddToCart}
                size="lg"
                disabled={isOutOfStock}
                className="w-full bg-foreground text-background hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                {isOutOfStock ? 'Esgotado' : 'Adicionar ao carrinho'}
              </Button>
            </div>

            {/* Informações Adicionais */}
            <div className="pt-4 border-t border-border space-y-2 text-sm text-muted-foreground">
              <p>
                <span className="font-semibold">SKU:</span> {product.sku}
              </p>
              {product.categories.length > 0 && (
                <p>
                  <span className="font-semibold">Categoria:</span>{' '}
                  {product.categories.map((cat) => cat.name).join(', ')}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Tabela de Medidas */}
        {product.size_chart && (
          <div className="mt-12">
            <SizeChart sizeChart={product.size_chart} />
          </div>
        )}

        {/* Produtos Relacionados */}
        <RelatedProducts
          currentProductId={product.id}
          categoryId={product.categories[0]?.id}
        />

        {/* Reviews (Placeholder) */}
        <div className="mt-16 pt-8 border-t border-border">
          <h2 className="text-2xl font-bold mb-6">Avaliações</h2>
          <div className="p-8 border border-border rounded-lg bg-muted/50 text-center">
            <p className="text-muted-foreground">
              Sistema de avaliações em breve
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}

// Componente de Produtos Relacionados
function RelatedProducts({
  currentProductId,
  categoryId
}: {
  currentProductId: string
  categoryId?: string
}) {
  const { addItem } = useCartStore()
  const router = useRouter()

  const { data: relatedProductsData, isLoading } = useQuery<{
    products: Array<{
      id: string
      name: string
      base_price: string
      main_image: string | null
      description: string | null
      category_name?: string | null
      slug: string
    }>
    total: number
  }>({
    queryKey: ['related-products', categoryId, currentProductId],
    queryFn: async () => {
      if (!categoryId) return { products: [], total: 0 }
      const response = await fetchAPI(`/products?category_id=${categoryId}&limit=4`)
      return response
    },
    enabled: !!categoryId,
    retry: 1,
  })

  if (!categoryId || !relatedProductsData || relatedProductsData.products.length === 0) {
    return null
  }

  // Filtrar o produto atual
  const relatedProducts = relatedProductsData.products
    .filter((p) => p.id !== currentProductId)
    .slice(0, 4)

  if (relatedProducts.length === 0) {
    return null
  }

  const handleAddToCart = (product: {
    id: string
    name: string
    price: number
    image: string
    category: string
    description?: string
  }) => {
    addItem(product)
    router.push('/carrinho')
  }

  return (
    <div className="mt-16">
      <h2 className="text-2xl font-bold mb-6">Você também pode gostar</h2>
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
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
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {relatedProducts.map((p) => {
            const productForCard = {
              id: p.id,
              name: p.name,
              price: parseFloat(p.base_price),
              image: p.main_image || 'https://via.placeholder.com/500',
              category: p.category_name || 'Geral',
              description: p.description || '',
            }
            return (
              <Link key={p.id} href={`/products/${p.slug}`}>
                <ProductCard product={productForCard} onAddToCart={handleAddToCart} />
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

