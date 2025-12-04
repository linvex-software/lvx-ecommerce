'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { CategoryForm } from '@/components/categories/category-form'
import { useCreateCategory, type CreateCategoryInput } from '@/lib/hooks/use-categories'

export default function NewCategoryPage() {
  const router = useRouter()
  const createCategory = useCreateCategory()

  const handleSubmit = async (data: CreateCategoryInput) => {
    await createCategory.mutateAsync(data)
    router.push('/categories')
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500">
            <Link href="/categories" className="inline-flex items-center gap-1 text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-4 w-4" />
              Voltar para categorias
            </Link>
          </p>
          <h1 className="mt-4 text-4xl font-light tracking-tight text-gray-900">Nova categoria</h1>
          <p className="mt-2 text-sm font-light text-gray-500">
            Adicione uma nova categoria para organizar seus produtos
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <CategoryForm onSubmit={handleSubmit} isLoading={createCategory.isPending} />
      </div>
    </div>
  )
}


