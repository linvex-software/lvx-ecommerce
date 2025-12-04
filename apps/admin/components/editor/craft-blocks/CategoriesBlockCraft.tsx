'use client'

import React from 'react'
import { useNode } from '@craftjs/core'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import axios from 'axios'
import { Card } from '@/components/ui/card'

interface CategoriesBlockCraftProps {
  title?: string
  limit?: number
  layout?: 'grid' | 'list'
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'

interface Category {
  id: string
  name: string
  slug: string
}

async function fetchAPI(path: string) {
  const storeId = process.env.NEXT_PUBLIC_STORE_ID
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (storeId) {
    headers['x-store-id'] = storeId
  }
  const response = await axios.get(`${API_URL}${path}`, { headers })
  return response.data
}

export const CategoriesBlockCraft = ({
  title = 'Nossas Categorias',
  limit = 6,
  layout = 'grid',
}: CategoriesBlockCraftProps) => {
  const { connectors: { connect, drag }, isSelected } = useNode((node) => ({
    isSelected: node.events.selected,
  }))

  const { data: categoriesData, isLoading } = useQuery<{ categories: Category[] }>({
    queryKey: ['categories-block', limit],
    queryFn: () => fetchAPI('/categories')
  })

  const categories = (categoriesData?.categories || []).slice(0, limit)

  if (isLoading) {
    return (
      <section 
        ref={(ref: HTMLDivElement | null) => connect(drag(ref))}
        className={`container mx-auto px-4 py-12 ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
      >
        <h2 className="text-3xl font-bold mb-8">{title}</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-secondary/50 aspect-square rounded-lg" />
            </div>
          ))}
        </div>
      </section>
    )
  }

  if (categories.length === 0) {
    return null
  }

  return (
    <section 
      ref={(ref: HTMLDivElement | null) => connect(drag(ref))}
      className={`container mx-auto px-4 py-12 ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
    >
      <h2 className="text-3xl font-bold mb-8 text-center">{title}</h2>
      <div className={`grid grid-cols-2 md:grid-cols-3 ${layout === 'grid' ? 'lg:grid-cols-6' : 'lg:grid-cols-3'} gap-4`}>
        {categories.map((category) => (
          <Link key={category.id} href={`/categories/${category.slug}`}>
            <Card className="p-6 text-center hover:shadow-lg transition-shadow cursor-pointer h-full flex items-center justify-center">
              <h3 className="font-semibold">{category.name}</h3>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  )
}

const CategoriesBlockSettings = () => {
  const { actions: { setProp }, props } = useNode((node) => ({
    props: node.data.props,
  }))

  return (
    <div className="space-y-4 p-4">
      <div>
        <label className="block text-sm font-medium mb-2">Título</label>
        <input
          type="text"
          value={props.title || ''}
          onChange={(e) => setProp((props: CategoriesBlockCraftProps) => (props.title = e.target.value))}
          className="w-full px-3 py-2 border rounded"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Limite: {props.limit || 6}</label>
        <input
          type="number"
          min="1"
          max="12"
          value={props.limit || 6}
          onChange={(e) => setProp((props: CategoriesBlockCraftProps) => (props.limit = parseInt(e.target.value)))}
          className="w-full px-3 py-2 border rounded"
        />
      </div>
    </div>
  )
}

