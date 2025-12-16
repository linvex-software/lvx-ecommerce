'use client'

import { useCreateProduct } from '@/lib/hooks/use-products'
import { ProductForm } from '@/components/products/product-form'
import type { ProductFormData } from '@/components/products/product-form'

export default function NewProductPage() {
  const createProduct = useCreateProduct()

  const handleSubmit = async (data: ProductFormData) => {
    const { priceDigits, ...restData } = data
    await createProduct.mutateAsync({
      ...restData,
      slug: restData.slug || restData.name.toLowerCase().replace(/\s+/g, '-'),
      sku: restData.sku || `SKU-${Date.now()}`,
      base_price: priceDigits ? Math.round(parseFloat(priceDigits) * 100) : 0,
      size_chart: data.size_chart ?? undefined
    })
  }

  return (
    <div className="space-y-8 pb-24 sm:pb-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl">Novo produto</h1>
        <p className="mt-2 text-sm text-text-secondary">
          Cadastre um novo produto para o catálogo da sua loja.
        </p>
      </div>

      <ProductForm onSubmit={handleSubmit} isLoading={createProduct.isPending} />
    </div>
  )
}

