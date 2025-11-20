'use client'

import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@white-label/ui'
import type { ProductFilters } from '@/lib/hooks/use-products'

interface ProductFiltersProps {
  filters: ProductFilters
  onFiltersChange: (filters: ProductFilters) => void
}

export function ProductFilters({ filters, onFiltersChange }: ProductFiltersProps) {
  const handleNameChange = (value: string) => {
    onFiltersChange({ ...filters, name: value || undefined, page: 1 })
  }

  const handleCategoryChange = (value: string) => {
    onFiltersChange({ ...filters, category_id: value || undefined, page: 1 })
  }

  const handleStatusChange = (value: string) => {
    onFiltersChange({
      ...filters,
      active: value === 'all' ? undefined : value === 'true',
      page: 1
    })
  }

  const handleClear = () => {
    onFiltersChange({ page: 1 })
  }

  const hasActiveFilters =
    filters.name || filters.category_id || filters.active !== undefined

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:flex-row sm:items-end">
      <div className="flex-1">
        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.35em] text-gray-400">
          Buscar por nome
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Nome do produto..."
            value={filters.name || ''}
            onChange={(e) => handleNameChange(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="sm:w-48">
        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.35em] text-gray-400">
          Categoria
        </label>
        <select
          value={filters.category_id || ''}
          onChange={(e) => handleCategoryChange(e.target.value)}
          className="flex h-11 w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm ring-offset-white placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="">Todas</option>
          {/* TODO: Carregar categorias da API */}
          <option value="cat1">Categoria 1</option>
          <option value="cat2">Categoria 2</option>
        </select>
      </div>

      <div className="sm:w-40">
        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.35em] text-gray-400">
          Status
        </label>
        <select
          value={
            filters.active === undefined
              ? 'all'
              : filters.active
                ? 'true'
                : 'false'
          }
          onChange={(e) => handleStatusChange(e.target.value)}
          className="flex h-11 w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm ring-offset-white placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="all">Todos</option>
          <option value="true">Ativo</option>
          <option value="false">Inativo</option>
        </select>
      </div>

      {hasActiveFilters && (
        <Button variant="outline" onClick={handleClear} className="gap-2">
          <X className="h-4 w-4" />
          Limpar
        </Button>
      )}
    </div>
  )
}

