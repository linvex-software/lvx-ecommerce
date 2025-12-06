'use client'

import { useState, useEffect } from 'react'
import { X, ShoppingCart } from 'lucide-react'
import { Button } from '@white-label/ui'
import { ProductSearch } from '@/components/pdv/product-search'
import { QuantityInput } from '@/components/pdv/quantity-input'
import { useCreatePhysicalSale } from '@/lib/hooks/use-physical-sales'
import { useProductStock } from '@/lib/hooks/use-products'
import type { Product } from '@/lib/hooks/use-products'
import type { PhysicalSale } from '@/lib/hooks/use-physical-sales'

interface NewSaleModalProps {
  isOpen: boolean
  onClose: () => void
  onSaleComplete: (sale: PhysicalSale) => void
}

export function NewSaleModal({ isOpen, onClose, onSaleComplete }: NewSaleModalProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [quantity, setQuantity] = useState(1)
  const createSale = useCreatePhysicalSale()

  const { data: stockData } = useProductStock(selectedProduct?.id ?? null, null)
  const currentStock = stockData?.stock?.current_stock ?? 0

  // Limpar estado quando modal fechar
  useEffect(() => {
    if (!isOpen) {
      setSelectedProduct(null)
      setQuantity(1)
    }
  }, [isOpen])

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product)
    setQuantity(1)
  }

  const handleClose = () => {
    setSelectedProduct(null)
    setQuantity(1)
    onClose()
  }

  const handleRegisterSale = async () => {
    if (!selectedProduct) {
      alert('Selecione um produto antes de registrar a venda.')
      return
    }

    if (quantity <= 0) {
      alert('A quantidade deve ser maior que zero.')
      return
    }

    if (quantity > currentStock) {
      alert(`O estoque disponível é de ${currentStock} unidades.`)
      return
    }

    try {
      const input = {
        product_id: selectedProduct.id,
        quantity,
        total: 0,
        coupon_code: null,
        shipping_address: null,
        commission_rate: null
      }

      const response = await createSale.mutateAsync(input)
      
      // Limpar formulário
      setSelectedProduct(null)
      setQuantity(1)
      
      // Fechar modal e passar dados da venda para exibir confirmação
      onClose()
      onSaleComplete(response.sale)
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || 'Erro ao registrar venda'
      alert(`Erro: ${errorMessage}`)
    }
  }

  const canRegisterSale = selectedProduct && quantity > 0 && quantity <= currentStock

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-8 py-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">Nova Venda</h2>
              <p className="mt-1 text-sm text-gray-500">Busque e selecione o produto</p>
            </div>
            <button
              onClick={handleClose}
              className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="px-8 py-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
            {/* Busca */}
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.35em] text-gray-400">
                Produto
              </label>
              <ProductSearch onSelect={handleProductSelect} />
            </div>

            {/* Produto Selecionado */}
            {selectedProduct && (
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
                <div className="flex items-start gap-4">
                  {selectedProduct.main_image && (
                    <img
                      src={selectedProduct.main_image}
                      alt={selectedProduct.name}
                      className="h-20 w-20 rounded-xl border border-gray-200 object-cover"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {selectedProduct.name}
                    </h3>
                    <div className="space-y-2">
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.35em] text-gray-400">SKU:</span>
                        <span className="text-sm font-medium text-gray-700">{selectedProduct.sku}</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.35em] text-gray-400">Preço:</span>
                        <span className="text-xl font-bold text-gray-900">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                          }).format(parseFloat(selectedProduct.base_price))}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                        <span className="text-xs font-semibold uppercase tracking-[0.35em] text-gray-400">
                          Estoque
                        </span>
                        <span
                          className={`text-lg font-bold ${
                            currentStock > 10
                              ? 'text-green-600'
                              : currentStock > 0
                              ? 'text-yellow-600'
                              : 'text-red-600'
                          }`}
                        >
                          {currentStock} un
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!selectedProduct && (
              <div className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-12 text-center">
                <p className="text-sm font-medium text-gray-500">
                  Nenhum produto selecionado
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  Busque e selecione um produto acima
                </p>
              </div>
            )}

            {/* Quantidade */}
            {selectedProduct && (
              <>
                <div>
                  <label className="mb-3 block text-xs font-semibold uppercase tracking-[0.35em] text-gray-400">
                    Quantidade
                  </label>
                  <QuantityInput
                    value={quantity}
                    onChange={setQuantity}
                    max={currentStock}
                    min={1}
                    disabled={createSale.isPending}
                  />
                </div>

                {/* Total */}
                <div className="rounded-xl border-2 border-gray-900 bg-gray-900 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-[0.35em] text-white/70">
                      Total
                    </span>
                    <span className="text-2xl font-bold text-white">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(parseFloat(selectedProduct.base_price) * quantity)}
                    </span>
                  </div>
                </div>

                {currentStock === 0 && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                    <p className="text-center text-sm font-medium text-red-600">
                      Produto sem estoque disponível
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-8 py-4 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={createSale.isPending}
              className="h-10"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleRegisterSale}
              disabled={!canRegisterSale || createSale.isPending || currentStock === 0}
              className="gap-2 min-w-[160px] h-10"
            >
              <ShoppingCart className="h-4 w-4" />
              {createSale.isPending ? 'Registrando...' : 'Registrar Venda'}
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}

