'use client'

import { use } from 'react'
import Link from 'next/link'
import { Edit } from 'lucide-react'
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
        <div className="text-sm font-light text-gray-500 dark:text-[#B5B5B5]">Carregando produto...</div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-sm font-medium text-gray-900 dark:text-white">Produto não encontrado</p>
        <p className="mt-1 text-xs text-gray-500 dark:text-[#B5B5B5]">O produto que você está procurando não existe</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho da página */}
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-text-primary dark:text-white sm:text-4xl">
          Estoque do produto
        </h1>
        <p className="mt-2 text-sm text-text-secondary dark:text-[#B5B5B5]">
          Gerencie o estoque de{' '}
          {product.name && (
            <>
              <Link
                href={`/products/${id}`}
                className="font-medium text-primary hover:underline dark:text-primary"
              >
                {product.name}
              </Link>
              {' '}e suas variações.
            </>
          )}
          {!product.name && 'este produto e suas variações.'}
        </p>
      </div>

      <StockManager
        productId={id}
        variants={(product as any).variants || []}
        productName={product.name}
        productIdForEdit={id}
      />
    </div>
  )
}

