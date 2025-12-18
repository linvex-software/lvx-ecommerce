'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, Package, Edit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/ui/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { useProducts, type ProductFilters } from '@/lib/hooks/use-products'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { useProductStock, type StockInfo } from '@/lib/hooks/use-products'

export default function StockPage() {
  const [filters, setFilters] = useState<ProductFilters>({ page: 1, limit: 50 })
  const { data, isLoading } = useProducts(filters)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Estoque"
        description="Gerencie o estoque de todos os produtos"
      />

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-label font-semibold text-text-secondary">
                Buscar por nome
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
                <Input
                  placeholder="Nome do produto..."
                  value={filters.q || ''}
                  onChange={(e) => setFilters({ ...filters, q: e.target.value || undefined, page: 1 })}
                  className="pl-9"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Estoque */}
      {isLoading ? (
        <Card>
          <CardContent className="p-8">
            <div className="text-center text-body text-text-secondary">
              Carregando estoque...
            </div>
          </CardContent>
        </Card>
      ) : !data || data.products.length === 0 ? (
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <Package className="mx-auto h-12 w-12 text-text-tertiary" />
              <p className="mt-4 text-body font-semibold text-text-primary">Nenhum produto encontrado</p>
              <p className="mt-1 text-small text-text-secondary">
                Tente ajustar os filtros ou criar um novo produto
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Estoque</TableHead>
                    <TableHead>Última Movimentação</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.products.map((product) => (
                    <ProductStockRow key={product.id} product={product} />
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

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

// Componente para exibir linha do estoque de cada produto
function ProductStockRow({ product }: { product: any }) {
  const { data: stockData, isLoading: isLoadingStock } = useProductStock(product.id, undefined)

  const stocks: StockInfo[] = stockData?.stocks || (stockData?.stock ? [stockData.stock] : [])
  const totalStock = stocks.reduce((sum, stock) => sum + stock.current_stock, 0)
  const lastMovement = stocks.length > 0
    ? stocks.reduce((latest, stock) => {
        if (!stock.last_movement_at) return latest
        if (!latest) return stock.last_movement_at
        return new Date(stock.last_movement_at) > new Date(latest)
          ? stock.last_movement_at
          : latest
      }, null as string | null)
    : null

  const getMainImage = (product: any): string | null => {
    if (product.main_image) {
      return product.main_image
    }
    if (product.images && product.images.length > 0) {
      const primary = product.images.find((img: any) => img.is_main)
      return (primary ?? product.images[0])?.image_url || null
    }
    return null
  }

  const getCategoryLabel = (product: any): string => {
    if (product.categories && product.categories.length > 0) {
      return product.categories.map((cat: any) => cat.name).join(', ')
    }
    if (product.category_name) {
      return product.category_name
    }
    return 'Sem categoria'
  }

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          {getMainImage(product) ? (
            <img
              src={getMainImage(product)!}
              alt={product.name}
              className="h-10 w-10 rounded-base object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-base bg-surface">
              <Package className="h-5 w-5 text-text-tertiary" />
            </div>
          )}
          <div>
            <p className="font-semibold text-text-primary">{product.name}</p>
            <p className="text-small text-text-secondary">SKU: {product.sku}</p>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <span className="text-body text-text-secondary">{getCategoryLabel(product)}</span>
      </TableCell>
      <TableCell className="text-right">
        {isLoadingStock ? (
          <span className="text-body text-text-tertiary">Carregando...</span>
        ) : (
          <span className="font-semibold text-text-primary">
            {totalStock > 0 ? `${totalStock} unidades` : 'Sem estoque'}
          </span>
        )}
      </TableCell>
      <TableCell>
        {lastMovement ? (
          <span className="text-body text-text-secondary">
            {new Date(lastMovement).toLocaleDateString('pt-BR')}
          </span>
        ) : (
          <span className="text-body text-text-tertiary">Nunca</span>
        )}
      </TableCell>
      <TableCell className="text-right">
        <Link href={`/stock/${product.id}`}>
          <Button variant="outline" size="sm" className="gap-2">
            <Edit className="h-4 w-4" />
            Gerenciar
          </Button>
        </Link>
      </TableCell>
    </TableRow>
  )
}
