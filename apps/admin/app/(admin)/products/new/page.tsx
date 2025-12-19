'use client'

import { useCreateProduct } from '@/lib/hooks/use-products'
import { ProductForm } from '@/components/products/product-form'
import type { ProductFormData } from '@/components/products/product-form'

export default function NewProductPage() {
  const createProduct = useCreateProduct()

  const handleSubmit = async (data: ProductFormData) => {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/82e2bda5-de42-49f5-a3db-2e7cfbf454f0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'new/page.tsx:10',message:'handleSubmit ENTRY in page',data:{hasData:!!data,dataKeys:Object.keys(data||{}),isPending:createProduct.isPending},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    // O ProductForm já calcula e envia base_price corretamente
    // Não precisamos recalcular aqui
    try {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/82e2bda5-de42-49f5-a3db-2e7cfbf454f0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'new/page.tsx:14',message:'About to call mutateAsync',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      await createProduct.mutateAsync({
      ...(data as any),
      slug: data.slug || data.name.toLowerCase().replace(/\s+/g, '-'),
      sku: data.sku || `SKU-${Date.now()}`,
      size_chart: data.size_chart ?? undefined
    })
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/82e2bda5-de42-49f5-a3db-2e7cfbf454f0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'new/page.tsx:18',message:'mutateAsync completed',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/82e2bda5-de42-49f5-a3db-2e7cfbf454f0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'new/page.tsx:20',message:'handleSubmit ERROR in page',data:{errorMessage:error instanceof Error?error.message:String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      throw error
    }
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

