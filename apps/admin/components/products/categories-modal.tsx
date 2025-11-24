'use client'

import { useState } from 'react'
import { Plus, Tag } from 'lucide-react'
import { Button } from '@white-label/ui'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { CategoryForm } from '@/components/categories/category-form'
import { CategoryTable } from '@/components/categories/category-table'
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  type Category,
  type CreateCategoryInput,
  type UpdateCategoryInput
} from '@/lib/hooks/use-categories'

export function CategoriesModal() {
  const [open, setOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const { data, isLoading } = useCategories()
  const createCategory = useCreateCategory()
  const updateCategory = useUpdateCategory()

  const categories = data?.categories || []

  const handleCreate = async (data: CreateCategoryInput) => {
    await createCategory.mutateAsync(data)
    setOpen(false)
  }

  const handleUpdate = async (data: UpdateCategoryInput) => {
    if (!editingCategory) return
    await updateCategory.mutateAsync({ id: editingCategory.id, ...data })
    setEditingCategory(null)
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
  }

  const handleCancelEdit = () => {
    setEditingCategory(null)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Tag className="h-4 w-4" />
          Categorias
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerenciar Categorias</DialogTitle>
          <DialogDescription>
            Crie e gerencie as categorias dos seus produtos
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Formulário de criação/edição */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold">
              {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
            </h3>
            <CategoryForm
              category={editingCategory}
              onSubmit={editingCategory ? handleUpdate : handleCreate}
              onCancel={editingCategory ? handleCancelEdit : undefined}
              isLoading={
                createCategory.isPending || updateCategory.isPending
              }
            />
          </div>

          {/* Lista de categorias */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                Categorias ({categories.length})
              </h3>
            </div>
            <CategoryTable
              categories={categories}
              onEdit={handleEdit}
              isLoading={isLoading}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

