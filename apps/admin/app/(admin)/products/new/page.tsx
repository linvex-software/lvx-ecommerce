'use client'

import { useCreateProduct } from '@/lib/hooks/use-products'
import { ProductForm } from '@/components/products/product-form'
import type { ProductFormData } from '@/components/products/product-form'

export default function NewProductPage() {
  const createProduct = useCreateProduct()

  const handleSubmit = async (data: ProductFormData) => {
    await createProduct.mutateAsync({
      ...data,
      size_chart: data.size_chart ?? undefined
    })
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-light tracking-tight text-gray-900">Novo produto</h1>
        <p className="mt-2 text-sm font-light text-gray-500">
          Adicione um novo produto ao catálogo da loja
        </p>
      </div>

      <ProductForm onSubmit={handleSubmit} isLoading={createProduct.isPending} />
    </div>
  )
}

