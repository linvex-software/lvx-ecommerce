'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/page-header'
import { Card } from '@/components/ui/card'
import { useProducts, type ProductFilters } from '@/lib/hooks/use-products'
import { ProductFilters as ProductFiltersComponent } from '@/components/products/product-filters'
import { ProductTable } from '@/components/products/product-table'

export default function ProductsPage() {
  const [filters, setFilters] = useState<ProductFilters>({ page: 1, limit: 20 })
  const { data, isLoading } = useProducts(filters)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Produtos"
        description="Gerencie o catálogo de produtos da sua loja"
        actions={
          <Button asChild>
            <Link href="/products/new">
              <Plus className="h-4 w-4" />
              Novo produto
            </Link>
          </Button>
        }
      />

      {/* Filtros */}
      <ProductFiltersComponent filters={filters} onFiltersChange={setFilters} />

      {/* Tabela */}
      <Card>
        <ProductTable products={data?.products || []} isLoading={isLoading} />
      </Card>

      {/* Paginação */}
      {data && data.totalPages > 1 && (
        <Card className="px-6 py-4">
          <div className="flex items-center justify-between">
            <p className="text-body text-text-secondary">
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
        </Card>
      )}
    </div>
  )
}
