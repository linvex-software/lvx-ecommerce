'use client'

import { useState } from 'react'
import { Plus, Clock, ShoppingCart } from 'lucide-react'
import { Button } from '@white-label/ui'
import { NewSaleModal } from '@/components/pdv/new-sale-modal'
import { SaleConfirmation } from '@/components/pdv/sale-confirmation'
import { usePhysicalSales, type PhysicalSale } from '@/lib/hooks/use-physical-sales'
import { useAuthStore } from '@/store/auth-store'
import { useQueryClient } from '@tanstack/react-query'

export default function PDVPage() {
  const [isNewSaleModalOpen, setIsNewSaleModalOpen] = useState(false)
  const [confirmedSale, setConfirmedSale] = useState<PhysicalSale | null>(null)
  const [showConfirmation, setShowConfirmation] = useState(false)

  const user = useAuthStore((state) => state.user)
  const queryClient = useQueryClient()

  // Buscar todas as vendas do vendedor logado (sem filtro de data)
  const { data: salesData, isLoading: isLoadingSales } = usePhysicalSales({
    seller_id: user?.id
  })

  const sales = salesData?.sales || []

  const handleSaleComplete = (sale: PhysicalSale) => {
    // Invalidar queries para atualizar lista
    queryClient.invalidateQueries({ queryKey: ['physical-sales'] })
    // Mostrar confirmação
    setConfirmedSale(sale)
    setShowConfirmation(true)
  }

  const handleCloseConfirmation = () => {
    setShowConfirmation(false)
    setConfirmedSale(null)
  }

  const formatCurrency = (cents: number) => {
    if (!cents || isNaN(cents)) return 'R$ 0,00'
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(cents / 100)
  }

  const formatTime = (date: string) => {
    const d = new Date(date)
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-8">
      {/* Header com Botão Nova Venda */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-light tracking-tight text-gray-900">PDV</h1>
          <p className="mt-2 text-sm font-light text-gray-500">
            Registre vendas físicas da sua loja
          </p>
        </div>
        <Button onClick={() => setIsNewSaleModalOpen(true)} className="gap-2" size="default">
          <Plus className="h-4 w-4" />
          Nova Venda
        </Button>
      </div>

      {/* Cards de Resumo - EM CIMA */}
      {sales.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-gray-400 mb-2">
              Total Vendas
            </p>
            <p className="text-3xl font-bold text-gray-900">{sales.length}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-gray-400 mb-2">
              Produtos
            </p>
            <p className="text-3xl font-bold text-gray-900">
              {sales.reduce((sum, sale) => sum + sale.quantity, 0)}
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-gray-400 mb-2">
              Faturamento
            </p>
            <p className="text-3xl font-bold text-gray-900">
              {formatCurrency(
                sales.reduce((sum, sale) => {
                  // total pode vir como string ou number do backend
                  const totalValue = typeof sale.total === 'string' 
                    ? Number.parseFloat(sale.total) 
                    : typeof sale.total === 'number' 
                    ? sale.total 
                    : 0
                  return sum + (isNaN(totalValue) ? 0 : totalValue)
                }, 0)
              )}
            </p>
          </div>
        </div>
      )}

      {/* Lista de Vendas */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Vendas Realizadas</h2>
              <p className="mt-1 text-xs text-gray-500">
                Histórico completo de vendas
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2">
              <Clock className="h-4 w-4 text-white" />
              <span className="text-sm font-semibold text-white">
                {sales.length} {sales.length === 1 ? 'venda' : 'vendas'}
              </span>
            </div>
          </div>
        </div>

        <div className="p-6">
          {isLoadingSales ? (
            <div className="py-12 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-900"></div>
              <p className="mt-4 text-sm text-gray-500">Carregando vendas...</p>
            </div>
          ) : sales.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 py-12 text-center">
              <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-4 text-sm font-medium text-gray-500">
                Nenhuma venda realizada ainda
              </p>
              <p className="mt-2 text-xs text-gray-400">
                Clique em "Nova Venda" para começar
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {sales.map((sale) => (
                <div
                  key={sale.id}
                  className="rounded-lg border border-gray-200 bg-white p-4 hover:border-gray-300 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                          <Clock className="h-3 w-3" />
                          {formatTime(sale.created_at)}
                        </span>
                      </div>
                      <h4 className="text-base font-semibold text-gray-900 mb-1.5">
                        {sale.product.name}
                      </h4>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="font-medium">SKU: {sale.product.sku}</span>
                        <span className="text-gray-300">•</span>
                        <span className="font-medium">Quantidade: {sale.quantity}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-gray-400 mb-1">
                        Total
                      </p>
                      <p className="text-xl font-bold text-gray-900">
                        {formatCurrency(
                          typeof sale.total === 'string' 
                            ? Number.parseFloat(sale.total) 
                            : sale.total
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal Nova Venda */}
      <NewSaleModal
        isOpen={isNewSaleModalOpen}
        onClose={() => setIsNewSaleModalOpen(false)}
        onSaleComplete={handleSaleComplete}
      />

      {showConfirmation && confirmedSale && (
        <SaleConfirmation sale={confirmedSale} onClose={handleCloseConfirmation} />
      )}
    </div>
  )
}
