'use client'

import { use } from 'react'
import { useProduct } from '@/lib/hooks/use-products'
import { StockManager } from '@/components/products/stock-manager'

interface ProductStockPageProps {
  params: Promise<{ id: string }>
}

export default function ProductStockPage({ params }: ProductStockPageProps) {
  const { id } = use(params)
  const { data: product, isLoading: isLoadingProduct } = useProduct(id)

  if (isLoadingProduct) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm font-light text-gray-500">Carregando produto...</div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-sm font-medium text-gray-900">Produto não encontrado</p>
        <p className="mt-1 text-xs text-gray-500">O produto que você está procurando não existe</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-light tracking-tight text-gray-900">
          Estoque do produto
        </h1>
        <p className="mt-2 text-sm font-light text-gray-500">
          Gerencie o estoque de <span className="font-medium">{product.name}</span>
        </p>
      </div>

      <StockManager
        productId={id}
        variants={(product as any).variants || []}
      />
    </div>
  )
}

