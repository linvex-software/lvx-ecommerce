"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export interface TopProduct {
  id: string
  name: string
  category: string
  revenue: string
  unitsSold: number
}

interface TopProductsProps {
  products: TopProduct[]
  isLoading?: boolean
}

export function TopProducts({ products, isLoading = false }: TopProductsProps) {
  const items: Array<TopProduct | null> = isLoading
    ? Array.from({ length: 4 }, () => null)
    : products

  return (
    <Card className="rounded-2xl border-gray-100 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-gray-400">
            Top produtos
          </p>
          <CardTitle className="text-2xl font-light text-gray-900">Mais vendidos</CardTitle>
        </div>
        {!isLoading && (
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
            Últimos 30 dias
          </span>
        )}
      </CardHeader>
      <CardContent className="divide-y divide-gray-100">
        {items.map((product, index) => (
          <div key={product ? product.id : index} className="flex items-center gap-4 py-4">
            <span className="text-sm font-semibold text-gray-400">#{index + 1}</span>
            <div className="flex flex-1 flex-col">
              {product ? (
                <>
                  <p className="text-base font-medium text-gray-900">{product.name}</p>
                  <p className="text-sm text-gray-500">{product.category}</p>
                </>
              ) : (
                <>
                  <span className="mb-1 block h-4 w-40 animate-pulse rounded bg-gray-200/80" />
                  <span className="block h-3 w-32 animate-pulse rounded bg-gray-200/60" />
                </>
              )}
            </div>
            <div className="text-right">
              {product ? (
                <>
                  <p className="text-sm font-semibold text-gray-900">{product.revenue}</p>
                  <p className="text-xs text-gray-500">{product.unitsSold} unidades</p>
                </>
              ) : (
                <>
                  <span className="mb-1 block h-4 w-24 animate-pulse rounded bg-gray-200/80" />
                  <span className="block h-3 w-16 animate-pulse rounded bg-gray-200/60" />
                </>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}


