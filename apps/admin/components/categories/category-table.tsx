'use client'

import { useMemo, useState } from 'react'
import { Edit, Trash2, ChevronRight } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Button } from '@white-label/ui'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import type { Category } from '@/lib/hooks/use-categories'
import { useDeleteCategory } from '@/lib/hooks/use-categories'
import { cn } from '@white-label/ui'

interface CategoryTableProps {
  categories: Category[]
  onEdit: (category: Category) => void
  isLoading?: boolean
}

interface CategoryWithLevel extends Category {
  level: number
  parentName?: string
}

// Função para organizar categorias em hierarquia e calcular níveis
function buildCategoryTree(categories: Category[]): CategoryWithLevel[] {
  const categoryMap = new Map<string, Category>()
  const rootCategories: Category[] = []
  const childrenMap = new Map<string, Category[]>()

  // Mapear todas as categorias
  categories.forEach((cat) => {
    categoryMap.set(cat.id, cat)
    if (!cat.parent_id) {
      rootCategories.push(cat)
    } else {
      if (!childrenMap.has(cat.parent_id)) {
        childrenMap.set(cat.parent_id, [])
      }
      childrenMap.get(cat.parent_id)!.push(cat)
    }
  })

  // Função recursiva para construir árvore com níveis
  const buildTree = (
    category: Category,
    level: number,
    parentName?: string
  ): CategoryWithLevel[] => {
    const result: CategoryWithLevel[] = [
      { ...category, level, parentName }
    ]

    const children = childrenMap.get(category.id) || []
    children.forEach((child) => {
      result.push(...buildTree(child, level + 1, category.name))
    })

    return result
  }

  // Construir árvore começando pelas raízes
  const tree: CategoryWithLevel[] = []
  rootCategories.forEach((root) => {
    tree.push(...buildTree(root, 0))
  })

  // Incluir categorias órfãs (com parent_id que não existe)
  categories.forEach((cat) => {
    if (cat.parent_id && !categoryMap.has(cat.parent_id)) {
      tree.push({ ...cat, level: 0, parentName: undefined })
    }
  })

  return tree
}

export function CategoryTable({ categories, onEdit, isLoading = false }: CategoryTableProps) {
  const deleteCategory = useDeleteCategory()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Organizar categorias em árvore hierárquica
  const categoryTree = useMemo(() => buildCategoryTree(categories), [categories])

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja excluir a categoria "${name}"?\n\nEsta ação não pode ser desfeita.`)) return

    setDeletingId(id)
    try {
      await deleteCategory.mutateAsync(id)
    } finally {
      setDeletingId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-[#1D1D1D] dark:bg-[#0A0A0A]">
        <Table>
          <TableHeader>
            <TableRow className="dark:border-[#1D1D1D]">
              <TableHead className="dark:text-[#E0E0E0]">Nome</TableHead>
              <TableHead className="dark:text-[#E0E0E0]">Slug</TableHead>
              <TableHead className="w-[100px] dark:text-[#E0E0E0]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[1, 2, 3].map((i) => (
              <TableRow key={i} className="dark:border-[#1D1D1D]">
                <TableCell>
                  <div className="h-4 w-32 animate-pulse rounded bg-gray-200 dark:bg-[#1A1A1A]" />
                </TableCell>
                <TableCell>
                  <div className="h-4 w-24 animate-pulse rounded bg-gray-200 dark:bg-[#1A1A1A]" />
                </TableCell>
                <TableCell>
                  <div className="h-8 w-8 animate-pulse rounded bg-gray-200 dark:bg-[#1A1A1A]" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  if (categories.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm dark:border-[#1D1D1D] dark:bg-[#0A0A0A]">
        <p className="text-sm font-medium text-gray-500 dark:text-[#CCCCCC]">Nenhuma categoria encontrada</p>
        <p className="mt-1 text-xs text-gray-400 dark:text-[#B5B5B5]">
          Tente ajustar os filtros ou criar uma nova categoria
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden dark:border-[#1D1D1D] dark:bg-[#0A0A0A]">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="dark:border-[#1D1D1D] hover:bg-transparent">
              <TableHead className="dark:text-[#E0E0E0]">Nome</TableHead>
              <TableHead className="hidden sm:table-cell dark:text-[#E0E0E0]">Slug</TableHead>
              <TableHead className="w-[100px] text-right dark:text-[#E0E0E0]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categoryTree.map((category) => (
              <TableRow
                key={category.id}
                className={`${category.level > 0 ? 'bg-gray-50/50 dark:bg-[#111111]/30' : ''} dark:border-[#1D1D1D] dark:hover:bg-[#1A1A1A] even:dark:bg-[#111111]/30`}
              >
                <TableCell>
                  <div className="flex items-center gap-3 min-w-0">
                    {category.level > 0 && (
                      <div
                        className="flex items-center flex-shrink-0"
                        style={{ width: `${category.level * 24}px`, paddingLeft: `${(category.level - 1) * 8}px` }}
                      >
                        <div className="flex items-center">
                          <ChevronRight className="h-4 w-4 text-blue-500 flex-shrink-0" />
                          <div className="w-1 h-6 bg-gradient-to-b from-blue-300 to-transparent ml-0.5" />
                        </div>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={`font-medium truncate ${category.level > 0 ? 'text-gray-700 dark:text-[#CCCCCC]' : 'text-gray-900 dark:text-white'}`}>
                          {category.name}
                        </p>
                        {category.level > 0 && (
                          <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 shrink-0 dark:bg-blue-900/30 dark:text-blue-300">
                            Subcategoria
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 sm:hidden">
                        <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600 truncate max-w-[200px] dark:bg-[#111111] dark:text-[#B5B5B5]">
                          {category.slug}
                        </code>
                      </div>
                      {category.parentName && (
                        <p className="text-xs text-blue-600 mt-1.5 font-medium hidden sm:flex items-center gap-1.5 dark:text-blue-400">
                          <span className="inline-flex items-center gap-1 text-gray-400 dark:text-[#777777]">
                            <span className="w-1 h-1 rounded-full bg-gray-400 dark:bg-[#777777]" />
                            Principal:
                          </span>
                          <span className="font-semibold text-blue-700 dark:text-blue-300">{category.parentName}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <code className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-600 dark:bg-[#111111] dark:text-[#B5B5B5]">
                    {category.slug}
                  </code>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                        <span className="sr-only">Abrir menu</span>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(category)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(category.id, category.name)}
                        disabled={deletingId === category.id}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {deletingId === category.id ? 'Excluindo...' : 'Excluir'}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
