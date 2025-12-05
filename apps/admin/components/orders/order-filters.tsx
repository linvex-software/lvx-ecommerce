'use client'

import { X, Calendar } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@white-label/ui'
import { useCustomers } from '@/lib/hooks/use-customers'
import type { OrderFilters } from '@/lib/hooks/use-orders'

interface OrderFiltersProps {
  filters: OrderFilters
  onFiltersChange: (filters: OrderFilters) => void
}

export function OrderFilters({ filters, onFiltersChange }: OrderFiltersProps) {
  const { data: customers, isLoading: customersLoading } = useCustomers()

  const handleStatusChange = (value: string) => {
    onFiltersChange({
      ...filters,
      status: value === 'all' ? undefined : (value as OrderFilters['status']),
      start_date: undefined,
      end_date: undefined
    })
  }

  const handlePaymentStatusChange = (value: string) => {
    onFiltersChange({
      ...filters,
      payment_status: value === 'all' ? undefined : (value as OrderFilters['payment_status']),
      start_date: undefined,
      end_date: undefined
    })
  }

  const handleCustomerChange = (value: string) => {
    onFiltersChange({
      ...filters,
      customer_id: value || undefined,
      start_date: undefined,
      end_date: undefined
    })
  }

  const handleStartDateChange = (value: string) => {
    onFiltersChange({
      ...filters,
      start_date: value || undefined
    })
  }

  const handleEndDateChange = (value: string) => {
    onFiltersChange({
      ...filters,
      end_date: value || undefined
    })
  }

  const handleClear = () => {
    onFiltersChange({})
  }

  const hasActiveFilters =
    filters.status ||
    filters.payment_status ||
    filters.customer_id ||
    filters.start_date ||
    filters.end_date

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:flex-row sm:items-end">
      <div className="sm:w-48">
        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.35em] text-gray-400">
          Status
        </label>
        <select
          value={filters.status || 'all'}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="flex h-11 w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm ring-offset-white placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="all">Todos</option>
          <option value="pending">Pendente</option>
          <option value="processing">Processando</option>
          <option value="shipped">Enviado</option>
          <option value="delivered">Entregue</option>
          <option value="cancelled">Cancelado</option>
        </select>
      </div>

      <div className="sm:w-48">
        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.35em] text-gray-400">
          Pagamento
        </label>
        <select
          value={filters.payment_status || 'all'}
          onChange={(e) => handlePaymentStatusChange(e.target.value)}
          className="flex h-11 w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm ring-offset-white placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="all">Todos</option>
          <option value="pending">Pendente</option>
          <option value="paid">Pago</option>
          <option value="refunded">Reembolsado</option>
          <option value="failed">Falhou</option>
        </select>
      </div>

      <div className="sm:w-56">
        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.35em] text-gray-400">
          Cliente
        </label>
        <select
          value={filters.customer_id || ''}
          onChange={(e) => handleCustomerChange(e.target.value)}
          disabled={customersLoading}
          className="flex h-11 w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm ring-offset-white placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="">Todos os clientes</option>
          {customers?.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.name} {customer.email && `(${customer.email})`}
            </option>
          ))}
        </select>
      </div>

      <div className="sm:w-44">
        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.35em] text-gray-400">
          Data Início
        </label>
        <div className="relative">
          <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            type="date"
            value={filters.start_date || ''}
            onChange={(e) => handleStartDateChange(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="sm:w-44">
        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.35em] text-gray-400">
          Data Fim
        </label>
        <div className="relative">
          <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            type="date"
            value={filters.end_date || ''}
            onChange={(e) => handleEndDateChange(e.target.value)}
            min={filters.start_date}
            className="pl-10"
          />
        </div>
      </div>

      {hasActiveFilters && (
        <Button variant="outline" onClick={handleClear} className="gap-2">
          <X className="h-4 w-4" />
          Limpar
        </Button>
      )}
    </div>
  )
}

