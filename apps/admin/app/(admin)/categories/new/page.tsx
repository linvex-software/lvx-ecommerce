'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { CategoryForm } from '@/components/categories/category-form'
import { useCreateCategory, type CreateCategoryInput, type UpdateCategoryInput } from '@/lib/hooks/use-categories'

export default function NewCategoryPage() {
  const router = useRouter()
  const createCategory = useCreateCategory()

  const handleSubmit = async (data: CreateCategoryInput | UpdateCategoryInput) => {
    await createCategory.mutateAsync(data as CreateCategoryInput)
    router.push('/categories')
  }

  return (
    <div className="w-full space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500 dark:text-[#B5B5B5]">
            <Link href="/categories" className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 hover:underline dark:text-blue-400 dark:hover:text-blue-300">
              <ArrowLeft className="h-4 w-4" />
              Voltar para categorias
            </Link>
          </p>
          <h1 className="mt-4 text-4xl font-light tracking-tight text-gray-900 dark:text-white">Nova categoria</h1>
          <p className="mt-2 text-sm font-light text-gray-500 dark:text-[#B5B5B5]">
            Adicione uma nova categoria para organizar seus produtos
          </p>
        </div>
      </div>

      {/* Formulário */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-[#1D1D1D] dark:bg-[#0A0A0A]">
        <CategoryForm
          onSubmit={handleSubmit}
          onCancel={() => router.push('/categories')}
          isLoading={createCategory.isPending}
        />
      </div>
    </div>
  )
}


