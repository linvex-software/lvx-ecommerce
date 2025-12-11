'use client'

import { FormEvent, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/ui/page-header'
import { Card } from '@/components/ui/card'
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
    <div className="space-y-6">
      <PageHeader
        title="Categorias"
        description="Organize e gerencie as categorias do seu catálogo"
        actions={
          <Button asChild>
            <Link href="/categories/new">
              <Plus className="h-4 w-4" />
              Nova categoria
            </Link>
          </Button>
        }
      />

      {/* Filtros */}
      <Card className="p-4 dark:bg-[#0A0A0A] dark:border-[#1D1D1D]">
        <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary dark:text-[#777777]" />
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar por nome ou slug"
              className="pl-9 dark:bg-[#111111] dark:border-[#2A2A2A] dark:text-white dark:placeholder:text-[#777777] dark:hover:border-[#3A3A3A]"
            />
          </div>
          <Button type="submit" variant="outline" className="dark:bg-[#111111] dark:border-[#2A2A2A] dark:text-white dark:hover:bg-[#1A1A1A]">
            Buscar
          </Button>
        </form>
      </Card>

      {/* Tabela */}
      <Card>
        <CategoryTable
          categories={data?.categories ?? []}
          onEdit={handleEdit}
          isLoading={isLoading}
        />
      </Card>

      {/* Paginação */}
      {data && data.totalPages > 1 && (
        <Card className="px-6 py-4">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-body text-text-secondary">
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
        </Card>
      )}
    </div>
  )
}
