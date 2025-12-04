'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { CategoryForm } from '@/components/categories/category-form'
import {
  useCategory,
  useUpdateCategory,
  type UpdateCategoryInput
} from '@/lib/hooks/use-categories'

export default function EditCategoryPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const categoryId = params?.id
  const { data: category, isLoading } = useCategory(categoryId)
  const updateCategory = useUpdateCategory()

  const handleSubmit = async (data: UpdateCategoryInput) => {
    if (!categoryId) return
    await updateCategory.mutateAsync({ id: categoryId, ...data })
    router.push('/categories')
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
        <div className="h-64 animate-pulse rounded-2xl bg-gray-100" />
      </div>
    )
  }

  if (!category) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-500">
          <Link href="/categories" className="inline-flex items-center gap-1 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-4 w-4" />
            Voltar para categorias
          </Link>
        </p>
        <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-red-700">
          Categoria não encontrada.
        </div>
      </div>
    )
  }

  return (
    <div className="w-full space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500">
            <Link href="/categories" className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 hover:underline">
              <ArrowLeft className="h-4 w-4" />
              Voltar para categorias
            </Link>
          </p>
          <h1 className="mt-4 text-4xl font-light tracking-tight text-gray-900">Editar categoria</h1>
          <p className="mt-2 text-sm font-light text-gray-500">
            Atualize os dados da categoria selecionada
          </p>
        </div>
      </div>

      {/* Formulário */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <CategoryForm
          category={category}
          onSubmit={handleSubmit}
          onCancel={() => router.push('/categories')}
          isLoading={updateCategory.isPending}
        />
      </div>
    </div>
  )
}


