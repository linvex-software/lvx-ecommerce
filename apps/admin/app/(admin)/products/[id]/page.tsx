'use client'

import { use } from 'react'
import { useProduct, useUpdateProduct } from '@/lib/hooks/use-products'
import { ProductForm } from '@/components/products/product-form'
import type { ProductFormData } from '@/components/products/product-form'

interface EditProductPageProps {
  params: Promise<{ id: string }>
}

export default function EditProductPage({ params }: EditProductPageProps) {
  const { id } = use(params)
  const { data: product, isLoading: isLoadingProduct } = useProduct(id)
  const updateProduct = useUpdateProduct()

  const handleSubmit = async (data: ProductFormData) => {
    await updateProduct.mutateAsync({ id, ...data })
  }

  if (isLoadingProduct) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm font-light text-gray-500">Carregando produto...</div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-sm font-medium text-gray-900">Produto não encontrado</p>
        <p className="mt-1 text-xs text-gray-500">O produto que você está procurando não existe</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-light tracking-tight text-gray-900">Editar produto</h1>
        <p className="mt-2 text-sm font-light text-gray-500">
          Atualize as informações do produto
        </p>
      </div>

      <ProductForm
        product={product}
        onSubmit={handleSubmit}
        isLoading={updateProduct.isPending}
      />
    </div>
  )
}

