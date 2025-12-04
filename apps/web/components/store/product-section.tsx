'use client'

import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { ProductCard } from './product-card'
import { useQuery } from '@tanstack/react-query'
import { fetchAPI } from '@/lib/api'
import { ColorConfig } from '@/components/editor/settings/types'
import { getColorWithOpacity } from '@/components/editor/settings/utils'

interface Product {
  id: string
  name: string
  base_price: string
  main_image?: string | null
  slug: string
  category_name?: string
}

interface ProductSectionProps {
  title?: string
  viewAllText?: string
  viewAllLink?: string
  productsCount?: number
  showNavigation?: boolean
  backgroundColor?: string | ColorConfig
  textColor?: string | ColorConfig
  useThemeTextColor?: boolean
  useThemeBackgroundColor?: boolean
  padding?: number
  gap?: number
}

export function ProductSection({
  title = 'OS IMPRESCINDÍVEIS DA PRIMAVERA',
  viewAllText = 'Ver Todos',
  viewAllLink = '/produtos',
  productsCount = 4,
  showNavigation = true,
  backgroundColor: backgroundColorProp = '#FAFAFA',
  textColor: textColorProp = '#000000',
  useThemeTextColor = false,
  useThemeBackgroundColor = false,
  padding = 60,
  gap = 20
}: ProductSectionProps) {
  // Resolver cores
  const backgroundColor = useThemeBackgroundColor
    ? 'var(--store-background-color, #FAFAFA)'
    : typeof backgroundColorProp === 'object'
    ? getColorWithOpacity(backgroundColorProp)
    : backgroundColorProp

  const textColor = useThemeTextColor
    ? 'var(--store-text-color, #000000)'
    : typeof textColorProp === 'object'
    ? getColorWithOpacity(textColorProp)
    : textColorProp
  const { data: productsData, isLoading } = useQuery<{ products: Product[] }>({
    queryKey: ['products', 'section', productsCount],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.append('limit', productsCount.toString())
      params.append('page', '1')
      return fetchAPI(`/products?${params.toString()}`) as Promise<{ products: Product[] }>
    }
  })

  const products: Product[] = productsData?.products || []

  return (
    <div
      className="w-full"
      style={{
        backgroundColor,
        padding: `100px ${padding}px`
      }}
    >
      <div
        className="flex flex-col gap-8"
        style={{
          gap: '32px'
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between"
          style={{
            maxWidth: '1287px'
          }}
        >
          <div className="flex items-center gap-6">
            <h2
              className="text-3xl font-normal"
              style={{
                fontFamily: 'Montserrat, sans-serif',
                fontSize: '32px',
                lineHeight: '1.25em',
                color: textColor
              }}
            >
              {title}
            </h2>
            {viewAllText && (
              <Link
                href={viewAllLink}
                className="text-base hover:opacity-70 transition-opacity"
                style={{
                  fontFamily: 'Roboto, sans-serif',
                  fontSize: '16px',
                  lineHeight: '1.5em',
                  color: textColor
                }}
              >
                {viewAllText}
              </Link>
            )}
          </div>

          {/* Navigation Arrows */}
          {showNavigation && (
            <div className="flex items-center gap-[18px]">
              <button
                className="p-3 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Previous"
              >
                <ChevronLeft className="w-6 h-6" style={{ color: textColor }} />
              </button>
              <button
                className="p-3 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Next"
              >
                <ChevronRight className="w-6 h-6" style={{ color: textColor }} />
              </button>
            </div>
          )}
        </div>

        {/* Products Grid */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
          style={{
            gap: `${gap}px`
          }}
        >
          {isLoading ? (
            Array.from({ length: productsCount }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 aspect-square rounded-lg mb-4" />
                <div className="h-4 bg-gray-200 rounded w-3/4" />
              </div>
            ))
          ) : products.length > 0 ? (
            products.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                price={product.base_price}
                image={product.main_image || ''}
                slug={product.slug}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-8 opacity-75">
              <p style={{ color: textColor }}>Nenhum produto encontrado</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

