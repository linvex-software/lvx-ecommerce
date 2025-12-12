'use client'

import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@white-label/ui'
import { useCategories } from '@/lib/hooks/use-categories'
import type { ProductFilters } from '@/lib/hooks/use-products'

interface ProductFiltersProps {
  filters: ProductFilters
  onFiltersChange: (filters: ProductFilters) => void
}

export function ProductFilters({ filters, onFiltersChange }: ProductFiltersProps) {
  const { data: categoriesData } = useCategories()
  const categories = categoriesData?.categories || []

  const handleNameChange = (value: string) => {
    onFiltersChange({ ...filters, q: value || undefined, page: 1 })
  }

  const handleCategoryChange = (value: string) => {
    onFiltersChange({ ...filters, category_id: value || undefined, page: 1 })
  }

  const handleStatusChange = (value: string) => {
    onFiltersChange({
      ...filters,
      status: value === 'all' ? undefined : (value as 'draft' | 'active' | 'inactive'),
      page: 1
    })
  }

  const handleClear = () => {
    onFiltersChange({ page: 1 })
  }

  const hasActiveFilters =
    filters.q || filters.category_id || filters.status !== undefined

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-[#1D1D1D] dark:bg-[#0A0A0A] sm:flex-row sm:items-end">
      <div className="flex-1">
        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.35em] text-gray-400 dark:text-[#CCCCCC]">
          Buscar por nome
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-[#777777]" />
          <Input
            placeholder="Nome do produto..."
            value={filters.q || ''}
            onChange={(e) => handleNameChange(e.target.value)}
            className="pl-10 dark:bg-[#111111] dark:border-[#2A2A2A] dark:text-white dark:placeholder:text-[#777777] dark:hover:border-[#3A3A3A]"
          />
        </div>
      </div>

      <div className="sm:w-48">
        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.35em] text-gray-400 dark:text-[#CCCCCC]">
          Categoria
        </label>
        <select
          value={filters.category_id || ''}
          onChange={(e) => handleCategoryChange(e.target.value)}
          className="flex h-11 w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm ring-offset-white placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#111111] dark:border-[#2A2A2A] dark:text-white dark:placeholder:text-[#777777] dark:hover:border-[#3A3A3A] dark:ring-offset-black"
        >
          <option value="">Todas</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div className="sm:w-40">
        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.35em] text-gray-400 dark:text-[#CCCCCC]">
          Status
        </label>
        <select
          value={filters.status || 'all'}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="flex h-11 w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm ring-offset-white placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#111111] dark:border-[#2A2A2A] dark:text-white dark:placeholder:text-[#777777] dark:hover:border-[#3A3A3A] dark:ring-offset-black"
        >
          <option value="all">Todos</option>
          <option value="active">Ativo</option>
          <option value="draft">Rascunho</option>
          <option value="inactive">Inativo</option>
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

