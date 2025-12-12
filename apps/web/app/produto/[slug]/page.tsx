'use client'

import { useQuery } from '@tanstack/react-query'
import { useParams, notFound, useRouter } from 'next/navigation'
import { fetchAPI } from '@/lib/api'
import { useState, useEffect } from 'react'
import { ArrowLeft, Heart, Minus, Plus, Truck, RefreshCw, Shield, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/template/flor-de-menina/components/ui/button'
import { useCart } from '@/components/template/flor-de-menina/components/contexts/CartContext'
import { ProductShowcase } from '@/components/template/flor-de-menina/components/home/ProductShowcase'
import { Header } from '@/components/template/flor-de-menina/components/layout/Header'
import { cn } from '@/lib/utils'

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
  main_image: string | null
  active: boolean
  images: ProductImage[]
  variants: ProductVariant[]
  categories: ProductCategory[]
  category_name?: string | null
  stock?: {
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
  const { addItem } = useCart()
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [selectedSize, setSelectedSize] = useState<string>('')
  const [selectedColor, setSelectedColor] = useState<string>('')
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [isFavorite, setIsFavorite] = useState(false)

  const { data, isLoading, error } = useQuery<ProductResponse>({
    queryKey: ['product', slug],
    queryFn: async () => {
      try {
        // Tentar buscar por slug primeiro
        const response = await fetchAPI(`/products/${slug}`)
        return response
      } catch (err) {
        // Se falhar, tentar buscar por ID
        try {
          const response = await fetchAPI(`/products/${slug}`)
          return response
        } catch (idErr) {
          if (idErr instanceof Error && 'status' in idErr && (idErr as { status?: number }).status === 404) {
            notFound()
          }
          throw idErr
        }
      }
    },
    retry: 1,
  })

  // Selecionar primeira cor e tamanho disponíveis se não houver seleção
  // Este hook DEVE ser chamado antes de qualquer early return para seguir as Rules of Hooks
  useEffect(() => {
    if (!data?.product) return

    const product = data.product
    const availableColors = Array.from(new Set(
      product.variants
        .filter(v => v.active && v.color)
        .map(v => v.color!)
    ))
    const availableSizes = Array.from(new Set(
      product.variants
        .filter(v => v.active && v.size)
        .map(v => v.size!)
    ))

    if (availableColors.length > 0 && !selectedColor) {
      setSelectedColor(availableColors[0])
    }
    if (availableSizes.length > 0 && !selectedSize) {
      setSelectedSize(availableSizes[0])
    }
  }, [data?.product, selectedColor, selectedSize])

  // Atualizar variant_id quando size ou color mudar
  // Este hook DEVE ser chamado antes de qualquer early return
  useEffect(() => {
    if (!data?.product) return

    const findVariant = (size: string | null, color: string | null): ProductVariant | null => {
      if (!data.product.variants || data.product.variants.length === 0) return null

      return data.product.variants.find(v =>
        v.active &&
        (size ? v.size === size : !v.size) &&
        (color ? v.color === color : !v.color)
      ) || null
    }

    const variant = findVariant(selectedSize || null, selectedColor || null)
    setSelectedVariantId(variant?.id || null)
  }, [data?.product, selectedSize, selectedColor])

  // Buscar estoque da variante selecionada ou do produto base
  // Este hook DEVE ser chamado antes de qualquer early return
  const { data: variantStockData } = useQuery<{ stock: { current_stock: number } }>({
    queryKey: ['product-stock', data?.product?.id, selectedVariantId],
    queryFn: async () => {
      if (!data?.product) {
        return { stock: { current_stock: 0 } }
      }

      // Se não há variante selecionada, buscar estoque do produto base
      if (!selectedVariantId) {
        try {
          const url = `/products/${data.product.id}/stock`
          const response = await fetchAPI(url)
          return response
        } catch (error) {
          // Fallback para estoque do produto retornado na busca inicial
          return { stock: { current_stock: data.product.stock?.current_stock ?? 0 } }
        }
      }
      // Buscar estoque da variante específica via endpoint público
      try {
        const url = `/products/${data.product.id}/stock?variant_id=${selectedVariantId}`
        const response = await fetchAPI(url)
        return response
      } catch (error) {
        // Se falhar, usar estoque do produto base como fallback
        console.warn('Não foi possível buscar estoque da variante, usando estoque do produto base')
        return { stock: { current_stock: data.product.stock?.current_stock ?? 0 } }
      }
    },
    enabled: !!data?.product?.id,
    retry: 1,
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
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

  // Imagem principal
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

  // Extrair tamanhos e cores únicos das variantes
  const availableSizes = Array.from(new Set(
    product.variants
      .filter(v => v.active && v.size)
      .map(v => v.size!)
  )).sort()

  const availableColors = Array.from(new Set(
    product.variants
      .filter(v => v.active && v.color)
      .map(v => v.color!)
  ))

  // Encontrar variante correta baseada em size + color selecionados
  const findVariant = (size: string | null, color: string | null): ProductVariant | null => {
    if (!product.variants || product.variants.length === 0) return null

    return product.variants.find(v =>
      v.active &&
      (size ? v.size === size : !v.size) &&
      (color ? v.color === color : !v.color)
    ) || null
  }

  // Calcular preço: usar price_override da variante se existir, senão usar base_price
  const selectedVariant = findVariant(selectedSize || null, selectedColor || null)
  const price = selectedVariant?.price_override
    ? parseFloat(selectedVariant.price_override)
    : parseFloat(product.base_price)

  // Estoque atual: da variante se selecionada, senão do produto base
  const currentStock = variantStockData?.stock?.current_stock ?? product.stock?.current_stock ?? 0
  const isOutOfStock = currentStock === 0

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price)
  }

  const handleAddToCart = () => {
    // Validar se há variantes e se uma foi selecionada
    const hasVariants = product.variants && product.variants.length > 0
    if (hasVariants) {
      // Se há variantes disponíveis, verificar se uma foi selecionada
      if (availableSizes.length > 0 && !selectedSize) {
        alert('Por favor, selecione um tamanho')
        return
      }
      if (availableColors.length > 0 && !selectedColor) {
        alert('Por favor, selecione uma cor')
        return
      }
      // Verificar se variante existe e está ativa
      if (!selectedVariant || !selectedVariant.active) {
        alert('Por favor, selecione uma variante válida')
        return
      }
    }

    // Validar estoque
    if (isOutOfStock || currentStock < quantity) {
      alert(`Estoque insuficiente. Disponível: ${currentStock} unidades`)
      return
    }

    const productToAdd = {
      id: product.id,
      name: product.name,
      price: price,
      images: allImages.map(img => img.image_url),
      category: product.categories[0]?.name || product.category_name || 'Geral',
      sizes: availableSizes,
      colors: availableColors.map(c => ({ name: c, hex: '#000000' })),
      description: product.description || '',
    }

    // Passar variant_id correto para o carrinho
    addItem(
      productToAdd, 
      selectedSize || '', 
      selectedColor || '', 
      quantity,
      selectedVariantId || null
    )
  }

  const handlePreviousImage = () => {
    setSelectedImageIndex((prev) =>
      prev === 0 ? allImages.length - 1 : prev - 1
    )
  }

  const handleNextImage = () => {
    setSelectedImageIndex((prev) =>
      prev === allImages.length - 1 ? 0 : prev + 1
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft size={16} />
            Voltar
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative aspect-square overflow-hidden bg-secondary rounded-lg group">
              <img
                src={currentMainImage}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              {allImages.length > 1 && (
                <>
                  <button
                    onClick={handlePreviousImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={handleNextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnails */}
            {allImages.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {allImages.map((image, index) => (
                  <button
                    key={image.id}
                    onClick={() => setSelectedImageIndex(index)}
                    className={cn(
                      "aspect-square overflow-hidden rounded-md border-2 transition-all",
                      selectedImageIndex === index
                        ? "border-primary"
                        : "border-transparent hover:border-muted-foreground/50"
                    )}
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

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="font-display text-3xl lg:text-4xl font-semibold text-foreground mb-2">
                {product.name}
              </h1>
              {product.categories.length > 0 && (
                <Link
                  href={`/categoria/${product.categories[0].slug}`}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {product.categories[0].name}
                </Link>
              )}
            </div>

            <div className="flex items-center gap-4">
              <span className="font-display text-3xl font-semibold text-foreground">
                {formatPrice(price)}
              </span>
              {isOutOfStock && (
                <span className="px-3 py-1 bg-muted text-muted-foreground text-sm rounded-full">
                  Esgotado
                </span>
              )}
            </div>

            {product.description && (
              <div className="prose prose-sm max-w-none">
                <p className="text-muted-foreground font-body leading-relaxed">
                  {product.description}
                </p>
              </div>
            )}

            {/* Size Selection */}
            {availableSizes.length > 0 && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Tamanho {selectedSize && `- ${selectedSize}`}
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableSizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={cn(
                        "px-4 py-2 border rounded-md transition-colors font-body",
                        selectedSize === size
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border hover:border-primary"
                      )}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Color Selection */}
            {availableColors.length > 0 && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Cor {selectedColor && `- ${selectedColor}`}
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={cn(
                        "px-4 py-2 border rounded-md transition-colors font-body",
                        selectedColor === color
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border hover:border-primary"
                      )}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Estoque da variante */}
            {selectedVariantId && (
              <div>
                <p className="text-sm text-muted-foreground">
                  Estoque: <span className="font-semibold text-foreground">{currentStock} unidades</span>
                </p>
              </div>
            )}

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium mb-2">Quantidade</label>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  disabled={quantity === 1}
                  className="p-2 border rounded-md hover:bg-secondary transition-colors disabled:opacity-50"
                >
                  <Minus size={16} />
                </button>
                <span className="text-lg font-medium w-12 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(q => q + 1)}
                  disabled={quantity >= currentStock}
                  className="p-2 border rounded-md hover:bg-secondary transition-colors disabled:opacity-50"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <Button
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                size="lg"
                className="flex-1"
                variant="gold"
              >
                {isOutOfStock ? 'Produto Esgotado' : 'Adicionar ao Carrinho'}
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => setIsFavorite(!isFavorite)}
                className={cn(
                  "px-4",
                  isFavorite && "bg-primary text-primary-foreground"
                )}
              >
                <Heart size={20} className={cn(isFavorite && "fill-current")} />
              </Button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Truck size={16} />
                <span>Frete Grátis</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <RefreshCw size={16} />
                <span>Troca Fácil</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield size={16} />
                <span>Compra Segura</span>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        <div className="mt-16">
          <ProductShowcase
            title="Produtos Relacionados"
            subtitle="Você também pode gostar"
            viewAllLink="/produtos"
            viewAllText="Ver Todos"
          />
        </div>
      </div>
    </div>
  )
}

