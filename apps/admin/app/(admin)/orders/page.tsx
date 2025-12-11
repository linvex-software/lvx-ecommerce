'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { Card } from '@/components/ui/card'
import { useOrders, type OrderFilters } from '@/lib/hooks/use-orders'
import { OrderTable } from '@/components/orders/order-table'
import { OrderFilters as OrderFiltersComponent } from '@/components/orders/order-filters'

export default function OrdersPage() {
  const [filters, setFilters] = useState<OrderFilters>({})
  const { data: orders, isLoading } = useOrders(filters)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pedidos"
        description="Gerencie os pedidos da sua loja"
      />

      {/* Filtros */}
      <OrderFiltersComponent filters={filters} onFiltersChange={setFilters} />

      {/* Tabela */}
      <Card>
        <OrderTable orders={orders || []} isLoading={isLoading} />
      </Card>
    </div>
  )
}
