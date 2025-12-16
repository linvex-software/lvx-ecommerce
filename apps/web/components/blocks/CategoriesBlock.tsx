'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { fetchAPI } from '@/lib/api'
import type { CategoriesBlockProps } from './types'

interface Category {
  id: string
  name: string
  slug: string
  image?: string | null
}

interface CategoriesBlockPropsWithStyles extends CategoriesBlockProps {
  blockId?: string
  elementStyles?: Record<string, any>
}

export function CategoriesBlock({
  title,
  limit = 6,
  blockId,
  elementStyles
}: CategoriesBlockPropsWithStyles) {
  const { data: categories, isLoading } = useQuery<Category[]>({
    queryKey: ['categories', limit],
    queryFn: async () => {
      return fetchAPI(`/catalog/categories?limit=${limit}`)
    }
  })

  if (isLoading) {
    return <div className="p-8 text-center">Carregando categorias...</div>
  }

  if (!categories || categories.length === 0) {
    return null
  }

  return (
    <section
      id={blockId}
      className="py-12 px-4"
      style={elementStyles}
    >
      <div className="container mx-auto">
        {title && (
          <h2 className="text-2xl font-bold mb-6 text-center">{title}</h2>
        )}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/categoria/${category.slug}`}
              className="group"
            >
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center hover:opacity-80 transition-opacity">
                {category.image ? (
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-gray-400 text-sm">{category.name}</span>
                )}
              </div>
              <p className="mt-2 text-center text-sm font-medium group-hover:underline">
                {category.name}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

