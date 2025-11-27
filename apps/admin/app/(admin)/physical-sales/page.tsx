'use client'

import { useState } from 'react'
import { usePhysicalSales, useCreatePhysicalSale, usePhysicalSalesReport } from '@/lib/hooks/use-physical-sales'
import { useProducts } from '@/lib/hooks/use-products'
import { apiClient } from '@/lib/api-client'

export default function PhysicalSalesPage() {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [filters, setFilters] = useState<{
    start_date?: string
    end_date?: string
    seller_id?: string
  }>({})

  // Form state
  const [formData, setFormData] = useState({
    product_id: '',
    quantity: 1,
    total: 0,
    coupon_code: '',
    zip_code: '',
    commission_rate: ''
  })

  const { data: salesData, isLoading } = usePhysicalSales({ ...filters, limit: 50 })
  const { data: products } = useProducts()
  const { data: report } = usePhysicalSalesReport(filters)
  const createSale = useCreatePhysicalSale()

  const handleCreateSale = async (e: React.FormEvent) => {
    e.preventDefault()

    const input = {
      product_id: formData.product_id,
      quantity: formData.quantity,
      total: formData.total || 0, // 0 = calcular automaticamente
      coupon_code: formData.coupon_code || null,
      shipping_address: formData.zip_code ? { zip_code: formData.zip_code } : null,
      commission_rate: formData.commission_rate ? parseFloat(formData.commission_rate) : null
    }

    try {
      await createSale.mutateAsync(input)
      alert('✅ Venda criada com sucesso!')
      setShowCreateForm(false)
      setFormData({
        product_id: '',
        quantity: 1,
        total: 0,
        coupon_code: '',
        zip_code: '',
        commission_rate: ''
      })
    } catch (error: any) {
      alert(`❌ Erro: ${error.response?.data?.error || error.message}`)
    }
  }

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(cents / 100)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR')
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-light tracking-tight text-gray-900">Vendas Físicas</h1>
          <p className="mt-2 text-sm font-light text-gray-500">
            Gerencie vendas realizadas em loja física
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          {showCreateForm ? 'Cancelar' : '+ Nova Venda'}
        </button>
      </div>

      {/* Formulário de criação */}
      {showCreateForm && (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">Criar Nova Venda</h2>
          <form onSubmit={handleCreateSale} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Produto</label>
              <select
                required
                value={formData.product_id}
                onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2"
              >
                <option value="">Selecione um produto</option>
                {products?.products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} - {formatCurrency(parseFloat(product.base_price) * 100)}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Quantidade</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                  className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Total (centavos, 0 = calcular)
                </label>
                <input
                  type="number"
                  value={formData.total}
                  onChange={(e) => setFormData({ ...formData, total: parseInt(e.target.value) || 0 })}
                  className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2"
                  placeholder="0 = calcular automaticamente"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Cupom (opcional)</label>
                <input
                  type="text"
                  value={formData.coupon_code}
                  onChange={(e) => setFormData({ ...formData, coupon_code: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2"
                  placeholder="TESTE10"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">CEP (opcional)</label>
                <input
                  type="text"
                  value={formData.zip_code}
                  onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2"
                  placeholder="01001000"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Taxa de Comissão % (opcional)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.commission_rate}
                onChange={(e) => setFormData({ ...formData, commission_rate: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2"
                placeholder="10"
              />
            </div>

            <button
              type="submit"
              disabled={createSale.isPending}
              className="w-full rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {createSale.isPending ? 'Criando...' : 'Criar Venda'}
            </button>
          </form>
        </div>
      )}

      {/* Filtros */}
      <div className="flex gap-4">
        <input
          type="date"
          value={filters.start_date || ''}
          onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          placeholder="Data inicial"
        />
        <input
          type="date"
          value={filters.end_date || ''}
          onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          placeholder="Data final"
        />
        <button
          onClick={() => setFilters({})}
          className="rounded-lg border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50"
        >
          Limpar Filtros
        </button>
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
                {report.report?.map((item: any) => (
                  <tr key={item.product_id} className="border-b">
                    <td className="px-4 py-2">{item.product_name}</td>
                    <td className="px-4 py-2 text-right">{item.total_quantity}</td>
                    <td className="px-4 py-2 text-right">{formatCurrency(item.total_amount)}</td>
                  </tr>
                ))}
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
                  {salesData?.sales.map((sale) => (
                    <tr key={sale.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-2">{formatDate(sale.created_at)}</td>
                      <td className="px-4 py-2">{sale.product.name}</td>
                      <td className="px-4 py-2 text-right">{sale.quantity}</td>
                      <td className="px-4 py-2 text-right">{formatCurrency(sale.subtotal)}</td>
                      <td className="px-4 py-2 text-right">{formatCurrency(sale.discount)}</td>
                      <td className="px-4 py-2 text-right font-semibold">
                        {formatCurrency(sale.total)}
                      </td>
                      <td className="px-4 py-2">{sale.seller?.name || '-'}</td>
                    </tr>
                  ))}
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

