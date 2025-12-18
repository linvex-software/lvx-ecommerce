"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export interface TopProduct {
  id: string
  name: string
  sku?: string
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
    <Card className="dark:bg-surface-2 dark:border-[#1D1D1D]">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-text-tertiary">
            Top produtos
          </p>
          <CardTitle className="text-2xl font-semibold text-text-primary dark:text-white">Mais vendidos</CardTitle>
        </div>
        {!isLoading && (
          <span className="rounded-full bg-surface px-3 py-1 text-xs font-medium text-text-secondary dark:bg-[#111111] dark:text-[#B5B5B5]">
            Últimos 30 dias
          </span>
        )}
      </CardHeader>
      <CardContent className="divide-y divide-border dark:divide-[#1D1D1D]">
        {items.map((product, index) => (
          <div key={product ? product.id : index} className="flex items-center gap-4 py-4">
            <span className="text-sm font-semibold text-text-tertiary">#{index + 1}</span>
            <div className="flex flex-1 flex-col">
              {product ? (
                <>
                  <p className="text-base font-medium text-text-primary dark:text-white">{product.name}</p>
                  <div className="flex items-center gap-2 text-sm text-text-secondary dark:text-[#B5B5B5]">
                    {product.sku && (
                      <code className="rounded bg-surface px-1.5 py-0.5 text-xs text-text-secondary dark:bg-[#111111] dark:text-[#B5B5B5]">
                        {product.sku}
                      </code>
                    )}
                    <span>{product.category || 'Sem categoria'}</span>
                  </div>
                </>
              ) : (
                <>
                  <span className="mb-1 block h-4 w-40 animate-pulse rounded bg-gray-200/80 dark:bg-[#111111]" />
                  <span className="block h-3 w-32 animate-pulse rounded bg-gray-200/60 dark:bg-[#111111]" />
                </>
              )}
            </div>
            <div className="text-right">
              {product ? (
                <>
                  <p className="text-sm font-semibold text-text-primary dark:text-white">{product.revenue}</p>
                  <p className="text-xs text-text-secondary dark:text-[#B5B5B5]">{product.unitsSold} unidades</p>
                </>
              ) : (
                <>
                  <span className="mb-1 block h-4 w-24 animate-pulse rounded bg-gray-200/80 dark:bg-[#111111]" />
                  <span className="block h-3 w-16 animate-pulse rounded bg-gray-200/60 dark:bg-[#111111]" />
                </>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}


