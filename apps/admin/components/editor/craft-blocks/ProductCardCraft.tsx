'use client'

import React from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@white-label/ui'

export interface Product {
  id: number | string
  name: string
  price: number
  image: string
  category: string
  sizes?: string[]
  colors?: { name: string; hex: string }[]
  stock?: number
  description?: string
  slug?: string
}

interface ProductCardCraftProps {
  product: Product
  onAddToCart: (product: Product) => void
}

export function ProductCardCraft({ product, onAddToCart }: ProductCardCraftProps) {
  const stock = product.stock ?? 0
  const isOutOfStock = stock === 0

  return (
    <Card className="group overflow-hidden border border-border hover:border-foreground transition-all duration-300 cursor-pointer h-full flex flex-col">
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white font-semibold">Esgotado</span>
          </div>
        )}
      </div>
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-lg mb-2 line-clamp-2">{product.name}</h3>
        <p className="text-sm text-muted-foreground mb-2">{product.category}</p>
        <div className="mt-auto pt-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-2xl font-bold">R$ {product.price.toFixed(2)}</span>
            {stock > 0 && stock <= 5 && (
              <span className="text-xs text-orange-600 font-medium">Últimas unidades!</span>
            )}
          </div>
          <Button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onAddToCart(product)
            }}
            disabled={isOutOfStock}
            className="w-full"
            variant={isOutOfStock ? 'outline' : 'default'}
          >
            {isOutOfStock ? 'Esgotado' : 'Adicionar ao Carrinho'}
          </Button>
        </div>
      </div>
    </Card>
  )
}












