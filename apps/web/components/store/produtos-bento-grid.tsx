'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ShoppingCart } from 'lucide-react'
import { fetchAPI } from '@/lib/api'
import { useCartStore } from '@/lib/store/useCartStore'
import toast from 'react-hot-toast'

interface BentoCard {
  productId?: string
  colSpan?: 1 | 2 | 3
  enabled?: boolean
}

interface ProdutosBentoGridProps {
  title?: string
  backgroundColor?: string
  card1?: BentoCard
  card2?: BentoCard
  card3?: BentoCard
  card4?: BentoCard
  card5?: BentoCard
}

const ALLOWED_COLORS = [
  '#f3f4f6', // Cinza claro (padrão)
  '#e5e7eb', // Cinza médio
  '#d1d5db', // Cinza
  '#9ca3af', // Cinza escuro
  '#ffffff', // Branco
  '#000000', // Preto
  '#1f2937', // Cinza muito escuro
  '#3b82f6', // Azul
  '#10b981', // Verde
  '#f59e0b', // Laranja
  '#ef4444', // Vermelho
  '#8b5cf6', // Roxo
  '#ec4899'  // Rosa
]

interface Product {
  id: string
  name: string
  slug: string
  base_price?: string | number
  main_image?: string | null
}

interface ProductData {
  id: string
  name: string
  slug: string
  base_price?: string | number
  main_image?: string | null
  category_name?: string | null
  categories?: Array<{ name: string }>
}

const defaultCard1: BentoCard = {
  enabled: false,
  colSpan: 2
}

const defaultCard2: BentoCard = {
  enabled: false,
  colSpan: 1
}

const defaultCard3: BentoCard = {
  enabled: false,
  colSpan: 1
}

const defaultCard4: BentoCard = {
  enabled: false,
  colSpan: 1
}

const defaultCard5: BentoCard = {
  enabled: false,
  colSpan: 1
}

export function ProdutosBentoGrid({
  title,
  backgroundColor = '#f3f4f6',
  card1 = defaultCard1,
  card2 = defaultCard2,
  card3 = defaultCard3,
  card4 = defaultCard4,
  card5 = defaultCard5
}: ProdutosBentoGridProps) {
      const [products, setProducts] = useState<Record<string, ProductData>>({})

  useEffect(() => {
    const loadProducts = async () => {
      const productIds = [card1.productId, card2.productId, card3.productId, card4.productId, card5.productId]
        .filter(Boolean) as string[]

      if (productIds.length === 0) return

      try {
        const productsData: Record<string, ProductData> = {}
        
        // Buscar todos os produtos e filtrar pelos IDs necessários
        const response = await fetchAPI('/products')
        if (response?.products) {
          // Normalizar IDs para string para comparação
          const normalizedProductIds = productIds.map(id => String(id))
          
          response.products.forEach((product: any) => {
            // Normalizar ID do produto para string
            const productId = String(product.id)
            
            if (normalizedProductIds.includes(productId)) {
              // Buscar imagem principal de várias formas possíveis
              let mainImage: string | null = null
              
              if (product.main_image) {
                mainImage = product.main_image
              } else if (product.images && Array.isArray(product.images) && product.images.length > 0) {
                // Procurar imagem com is_main = true
                const mainImg = product.images.find((img: any) => img.is_main === true || img.is_main === 'true')
                if (mainImg?.image_url) {
                  mainImage = mainImg.image_url
                } else if (product.images[0]?.image_url) {
                  // Se não encontrar is_main, usar a primeira
                  mainImage = product.images[0].image_url
                }
              }
              
              productsData[productId] = {
                id: productId,
                name: product.name,
                slug: product.slug,
                base_price: product.base_price || product.price || 0,
                main_image: mainImage,
                category_name: product.category_name || product.categories?.[0]?.name || 'Geral',
                categories: product.categories || []
              }
            }
          })
        }

        setProducts(productsData)
      } catch (error) {
        console.error('[BentoGrid] Erro ao carregar produtos:', error)
      }
    }

    loadProducts()
  }, [card1.productId, card2.productId, card3.productId, card4.productId, card5.productId])

  const safeBackgroundColor = ALLOWED_COLORS.includes(backgroundColor)
    ? backgroundColor
    : ALLOWED_COLORS[0]

  const { addItem, openCart } = useCartStore()

  const handleAddToCart = (e: React.MouseEvent, product: ProductData) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Garantir que o preço seja um número válido
    let price: number
    if (typeof product.base_price === 'string') {
      price = parseFloat(product.base_price)
    } else if (typeof product.base_price === 'number') {
      price = product.base_price
    } else {
      price = 0
    }
    
    // Validar preço
    if (!Number.isFinite(price) || price <= 0) {
      console.warn('Produto sem preço válido:', product, 'Preço:', price)
      return
    }
    
    // Garantir que o ID seja string (a API espera UUID como string)
    const productId = typeof product.id === 'string' ? product.id : String(product.id)
    
    const cartProduct = {
      id: productId,
      name: product.name,
      price: price, // Garantir que seja número
      image: product.main_image || '',
      category: product.category_name || product.categories?.[0]?.name || 'Geral'
    }
    
    addItem(cartProduct)
    
    // Mostrar notificação de sucesso
    toast.success('Produto adicionado ao carrinho!', {
      duration: 3000,
    })
    
    // Abrir carrinho após adicionar
    openCart()
  }

  const formatPrice = (price?: string | number) => {
    if (!price) return 'R$ 0,00'
    const numPrice = typeof price === 'string' ? parseFloat(price) : price
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(numPrice)
  }

  const renderCard = (card: BentoCard, index: number) => {
    if (!card.enabled || !card.productId) return null

    // Normalizar ID para string para busca
    const productId = String(card.productId)
    const product = products[productId]
    
    // Se o produto ainda não foi carregado, retorna null (será renderizado quando carregar)
    if (!product) {
      return null
    }
    
    if (!product.main_image) {
      return null
    }

    const colSpan = card.colSpan || 1
    const colSpanClass = 
      colSpan === 3 ? 'col-span-1 md:col-span-3' :
      colSpan === 2 ? 'col-span-1 md:col-span-2' :
      'col-span-1 md:col-span-1'
    const productLink = `/products/${product.slug}`

    return (
      <Link
        key={index}
        href={productLink}
        className={`${colSpanClass} overflow-hidden md:hover:scale-[1.02] hover:shadow-lg transition-all duration-200 ease-in-out h-[330px] rounded-xl relative group`}
        onMouseEnter={(e) => {
          const infoOverlay = e.currentTarget.querySelector('.bento-info-overlay') as HTMLElement
          if (infoOverlay) {
            infoOverlay.style.opacity = '1'
          }
        }}
        onMouseLeave={(e) => {
          const infoOverlay = e.currentTarget.querySelector('.bento-info-overlay') as HTMLElement
          if (infoOverlay) {
            infoOverlay.style.opacity = '0'
          }
        }}
      >
        {/* Background color - deve ficar ATRÁS da imagem */}
        <div 
          className="absolute inset-0 rounded-xl z-0"
          style={{
            backgroundColor: safeBackgroundColor
          }}
        />
        {/* Imagem - deve ficar ACIMA do background, mas não cobrir completamente */}
        <img
          src={product.main_image}
          alt={product.name}
          className="w-full h-full object-cover rounded-xl relative z-10"
          style={{
            mixBlendMode: 'normal'
          }}
        />
        {/* Overlay com gradiente e informações do produto - deve ficar ACIMA de tudo */}
        <div 
          className="bento-info-overlay absolute inset-0 rounded-xl flex flex-col justify-end p-4 md:opacity-0 opacity-100 transition-opacity duration-200 z-20"
          style={{
            background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.5) 50%, transparent 100%)'
          }}
        >
          <div className="text-white">
            <h3 className="text-lg font-semibold mb-1">{product.name}</h3>
            {product.base_price && (
              <p className="text-sm mb-3 font-medium">{formatPrice(product.base_price)}</p>
            )}
            <button
              onClick={(e) => handleAddToCart(e, product)}
              className="bg-white text-black px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors flex items-center justify-center gap-1.5 w-auto"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              Adicionar
            </button>
          </div>
        </div>
      </Link>
    )
  }

  return (
    <section
      id='produtos-bento-grid'
      className='bg-white rounded-3xl p-4 my-16 mx-auto w-full'
      style={{
        maxWidth: '100%'
      }}
    >
      {title && (
        <h2 className="text-3xl md:text-4xl font-semibold mb-8 text-base-content">
          {title}
        </h2>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 md:items-start md:justify-start gap-4 auto-rows-fr w-full">
        {renderCard(card1, 1)}
        {renderCard(card2, 2)}
        {renderCard(card3, 3)}
        {renderCard(card4, 4)}
        {renderCard(card5, 5)}
      </div>
    </section>
  )
}
