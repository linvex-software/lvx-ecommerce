'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@white-label/ui'
import { useProducts, type ProductFilters } from '@/lib/hooks/use-products'
import { ProductFilters as ProductFiltersComponent } from '@/components/products/product-filters'
import { ProductTable } from '@/components/products/product-table'

export default function ProductsPage() {
  const [filters, setFilters] = useState<ProductFilters>({ page: 1, limit: 20 })
  const { data, isLoading } = useProducts(filters)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-light tracking-tight text-gray-900">Produtos</h1>
          <p className="mt-2 text-sm font-light text-gray-500">
            Gerencie o catálogo de produtos da sua loja
          </p>
        </div>
        <Button asChild className="gap-2">
          <Link href="/products/new">
            <Plus className="h-4 w-4" />
            Novo produto
          </Link>
        </Button>
      </div>

      {/* Filtros */}
      <ProductFiltersComponent filters={filters} onFiltersChange={setFilters} />

      {/* Tabela */}
      <ProductTable products={data?.products || []} isLoading={isLoading} />

      {/* Paginação simples */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-6 py-4">
          <p className="text-sm text-gray-600">
            Mostrando {data.products.length} de {data.total} produtos
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={filters.page === 1}
              onClick={() => setFilters({ ...filters, page: (filters.page || 1) - 1 })}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              disabled={filters.page === data.totalPages}
              onClick={() => setFilters({ ...filters, page: (filters.page || 1) + 1 })}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

