'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useOrders, type OrderFilters } from '@/lib/hooks/use-orders'
import { OrderTable } from '@/components/orders/order-table'

export default function OrdersPage() {
  const [filters, setFilters] = useState<OrderFilters>({})
  const { data: orders, isLoading } = useOrders(filters)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-light tracking-tight text-gray-900">Pedidos</h1>
          <p className="mt-2 text-sm font-light text-gray-500">
            Gerencie os pedidos da sua loja
          </p>
        </div>
      </div>

      {/* Filtros simples */}
      <div className="flex gap-4">
        <select
          value={filters.status || ''}
          onChange={(e) =>
            setFilters({ ...filters, status: e.target.value as OrderFilters['status'] || undefined })
          }
          className="flex h-11 w-48 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm"
        >
          <option value="">Todos os status</option>
          <option value="pending">Pendente</option>
          <option value="processing">Processando</option>
          <option value="shipped">Enviado</option>
          <option value="delivered">Entregue</option>
          <option value="cancelled">Cancelado</option>
        </select>

        <select
          value={filters.payment_status || ''}
          onChange={(e) =>
            setFilters({
              ...filters,
              payment_status: e.target.value as OrderFilters['payment_status'] || undefined
            })
          }
          className="flex h-11 w-48 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm"
        >
          <option value="">Todos os pagamentos</option>
          <option value="pending">Pendente</option>
          <option value="paid">Pago</option>
          <option value="refunded">Reembolsado</option>
          <option value="failed">Falhou</option>
        </select>
      </div>

      {/* Tabela */}
      <OrderTable orders={orders || []} isLoading={isLoading} />
    </div>
  )
}

