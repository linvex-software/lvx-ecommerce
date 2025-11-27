'use client'

import { useState } from 'react'
import { usePhysicalSales, usePhysicalSalesReport } from '@/lib/hooks/use-physical-sales'
import { useUsers } from '@/lib/hooks/use-users'

export default function PhysicalSalesPage() {
  const [filters, setFilters] = useState<{
    start_date?: string
    end_date?: string
    seller_id?: string
  }>({})

  const { data: salesData, isLoading } = usePhysicalSales({ ...filters, limit: 50 })
  const { data: usersData } = useUsers()
  const { data: report } = usePhysicalSalesReport(filters)

  // Filtrar apenas vendedores
  const sellers = usersData?.users.filter(user => user.role === 'vendedor') || []

  const formatCurrency = (cents: number | string | undefined) => {
    if (!cents) return 'R$ 0,00'
    const value = typeof cents === 'string' ? Number.parseFloat(cents) : cents
    if (isNaN(value)) return 'R$ 0,00'
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value / 100)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR')
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-light tracking-tight text-gray-900">Vendas Físicas</h1>
        <p className="mt-2 text-sm font-light text-gray-500">
          Gerencie vendas realizadas em loja física
        </p>
      </div>

      {/* Filtros */}
      <div className="flex items-end gap-4">
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.35em] text-gray-400">
            Data Inicial
          </label>
          <input
            type="date"
            value={filters.start_date || ''}
            onChange={(e) => setFilters({ ...filters, start_date: e.target.value || undefined })}
            className="flex h-11 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.35em] text-gray-400">
            Filtrar por Vendedor
          </label>
          <select
            value={filters.seller_id || ''}
            onChange={(e) => 
              setFilters({ 
                ...filters, 
                seller_id: e.target.value || undefined 
              })
            }
            className="flex h-11 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm min-w-[250px]"
          >
            <option value="">Todos os vendedores</option>
            {sellers.map((seller) => (
              <option key={seller.id} value={seller.id}>
                {seller.name} ({seller.email})
              </option>
            ))}
          </select>
        </div>
        <div>
          <button
            onClick={() => setFilters({})}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors h-11"
          >
            Limpar Filtros
          </button>
        </div>
      </div>

      {/* Relatório por produto */}
      {report && (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">Relatório por Produto</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-2 text-left">Produto</th>
                  <th className="px-4 py-2 text-right">Quantidade</th>
                  <th className="px-4 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {report.report?.map((item: any) => {
                  const totalAmount = typeof item.total_amount === 'string'
                    ? Number.parseFloat(item.total_amount)
                    : typeof item.total_amount === 'number'
                    ? item.total_amount
                    : 0

                  return (
                    <tr key={item.product_id} className="border-b">
                      <td className="px-4 py-2">{item.product_name}</td>
                      <td className="px-4 py-2 text-right">{item.total_quantity}</td>
                      <td className="px-4 py-2 text-right">{formatCurrency(totalAmount)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Lista de vendas */}
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="p-6">
          <h2 className="mb-4 text-lg font-semibold">Vendas Realizadas</h2>
          {isLoading ? (
            <p className="text-gray-500">Carregando...</p>
          ) : salesData?.sales.length === 0 ? (
            <p className="text-gray-500">Nenhuma venda encontrada</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="px-4 py-2 text-left">Data</th>
                    <th className="px-4 py-2 text-left">Produto</th>
                    <th className="px-4 py-2 text-right">Qtd</th>
                    <th className="px-4 py-2 text-right">Subtotal</th>
                    <th className="px-4 py-2 text-right">Desconto</th>
                    <th className="px-4 py-2 text-right">Total</th>
                    <th className="px-4 py-2 text-left">Vendedor</th>
                  </tr>
                </thead>
                <tbody>
                  {salesData?.sales.map((sale) => {
                    // Converter total de string para number se necessário
                    const totalValue = typeof sale.total === 'string' 
                      ? Number.parseFloat(sale.total) 
                      : typeof sale.total === 'number' 
                      ? sale.total 
                      : 0
                    
                    const subtotalValue = typeof sale.subtotal === 'string'
                      ? Number.parseFloat(sale.subtotal)
                      : typeof sale.subtotal === 'number'
                      ? sale.subtotal
                      : 0
                    
                    const discountValue = typeof sale.discount === 'string'
                      ? Number.parseFloat(sale.discount)
                      : typeof sale.discount === 'number'
                      ? sale.discount
                      : 0

                    return (
                      <tr key={sale.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-2">{formatDate(sale.created_at)}</td>
                        <td className="px-4 py-2">{sale.product.name}</td>
                        <td className="px-4 py-2 text-right">{sale.quantity}</td>
                        <td className="px-4 py-2 text-right">{formatCurrency(subtotalValue)}</td>
                        <td className="px-4 py-2 text-right">{formatCurrency(discountValue)}</td>
                        <td className="px-4 py-2 text-right font-semibold">
                          {formatCurrency(totalValue)}
                        </td>
                        <td className="px-4 py-2">{sale.seller?.name || '-'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
          {salesData && (
            <div className="mt-4 text-sm text-gray-500">
              Total: {salesData.total} vendas
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

