'use client'

import { FormEvent, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Search } from 'lucide-react'
import { Button } from '@white-label/ui'
import { Input } from '@/components/ui/input'
import { CategoryTable } from '@/components/categories/category-table'
import {
  useCategories,
  type Category,
  type CategoryListFilters
} from '@/lib/hooks/use-categories'

export default function CategoriesPage() {
  const [filters, setFilters] = useState<CategoryListFilters>({ page: 1, limit: 20 })
  const [searchTerm, setSearchTerm] = useState(filters.q ?? '')
  const { data, isLoading } = useCategories(filters)
  const router = useRouter()

  const totalPages = useMemo(() => data?.totalPages ?? 1, [data?.totalPages])
  const currentPage = filters.page ?? 1

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFilters((prev) => ({
      ...prev,
      page: 1,
      q: searchTerm.trim() ? searchTerm.trim() : undefined
    }))
  }

  const handlePageChange = (direction: 'prev' | 'next') => {
    setFilters((prev) => {
      const page = prev.page ?? 1
      const nextPage = direction === 'prev' ? page - 1 : page + 1
      const boundedPage = Math.min(Math.max(nextPage, 1), totalPages)
      return { ...prev, page: boundedPage }
    })
  }

  const handleEdit = (category: Category) => {
    router.push(`/categories/${category.id}`)
  }

  return (
    <div className="w-full space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-light tracking-tight text-gray-900">Categorias</h1>
          <p className="mt-2 text-sm font-light text-gray-500">
            Organize e gerencie as categorias do seu catálogo
          </p>
        </div>
        <Button asChild className="gap-2">
          <Link href="/categories/new">
            <Plus className="h-4 w-4" />
            Nova categoria
          </Link>
        </Button>
      </div>

      {/* Filtros */}
      <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Buscar por nome ou slug"
            className="pl-9"
          />
        </div>
        <Button type="submit" variant="outline">
          Buscar
        </Button>
      </form>

      {/* Tabela */}
      <CategoryTable
        categories={data?.categories ?? []}
        onEdit={handleEdit}
        isLoading={isLoading}
      />

      {/* Paginação */}
      {data && data.totalPages > 1 && (
        <div className="flex flex-col items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white px-6 py-4 sm:flex-row">
          <p className="text-sm text-gray-600">
            Mostrando {data.categories.length} de {data.total} categorias
          </p>
          <div className="flex gap-2">
            <Button variant="outline" disabled={currentPage === 1} onClick={() => handlePageChange('prev')}>
              Anterior
            </Button>
            <Button
              variant="outline"
              disabled={currentPage === totalPages}
              onClick={() => handlePageChange('next')}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}


