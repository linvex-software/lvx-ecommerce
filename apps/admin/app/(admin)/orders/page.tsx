'use client'

import { useState } from 'react'
import { useOrders, type OrderFilters } from '@/lib/hooks/use-orders'
import { OrderTable } from '@/components/orders/order-table'
import { OrderFilters as OrderFiltersComponent } from '@/components/orders/order-filters'

export default function OrdersPage() {
  const [filters, setFilters] = useState<OrderFilters>({})
  const { data: orders, isLoading } = useOrders(filters)

  return (
    <div className="w-full space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-light tracking-tight text-gray-900">Pedidos</h1>
          <p className="mt-2 text-sm font-light text-gray-500">
            Gerencie os pedidos da sua loja
          </p>
        </div>
      </div>

      {/* Filtros */}
      <OrderFiltersComponent filters={filters} onFiltersChange={setFilters} />

      {/* Tabela */}
      <OrderTable orders={orders || []} isLoading={isLoading} />
    </div>
  )
}

