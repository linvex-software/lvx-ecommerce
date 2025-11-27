'use client'

import { Package, AlertCircle } from 'lucide-react'
import { useProductStock } from '@/lib/hooks/use-products'
import type { Product } from '@/lib/hooks/use-products'

interface ProductInfoProps {
  product: Product | null
  variantId?: string | null
}

export function ProductInfo({ product, variantId }: ProductInfoProps) {
  const { data: stockData, isLoading: isLoadingStock } = useProductStock(
    product?.id ?? null,
    variantId ?? undefined
  )

  if (!product) {
    return (
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-8 text-center shadow-sm">
        <Package className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-4 text-sm font-medium text-gray-500">
          Selecione um produto para ver as informações
        </p>
      </div>
    )
  }

  const stock = stockData?.stock
  const currentStock = stock?.current_stock ?? 0

  const formatPrice = (price: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(parseFloat(price))
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.35em] text-gray-400">
        Produto Selecionado
      </h3>
      
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="text-xl font-semibold text-gray-900">{product.name}</h4>
          <div className="mt-3 space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.35em] text-gray-400">SKU:</span>
              <span className="text-sm font-medium text-gray-700">{product.sku}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.35em] text-gray-400">Preço:</span>
              <span className="text-lg font-bold text-gray-900">{formatPrice(product.base_price)}</span>
            </div>
          </div>
        </div>
        {product.main_image && (
          <img
            src={product.main_image}
            alt={product.name}
            className="ml-6 h-24 w-24 rounded-xl border border-gray-200 object-cover shadow-sm"
          />
        )}
      </div>

      <div className="mt-6 rounded-xl border border-gray-100 bg-gray-50 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-gray-400">Estoque Atual</p>
            {isLoadingStock ? (
              <p className="mt-2 text-sm text-gray-500">Carregando...</p>
            ) : (
              <p
                className={`mt-2 text-3xl font-bold ${
                  currentStock > 10
                    ? 'text-green-600'
                    : currentStock > 0
                    ? 'text-yellow-600'
                    : 'text-red-600'
                }`}
              >
                {currentStock} <span className="text-lg font-normal text-gray-600">unidades</span>
              </p>
            )}
          </div>
          {currentStock === 0 && !isLoadingStock && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-2.5 border border-red-200">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <span className="text-sm font-semibold text-red-700">Sem estoque</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

