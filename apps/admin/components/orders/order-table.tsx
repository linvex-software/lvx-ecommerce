'use client'

import Link from 'next/link'
import { Package, ExternalLink } from 'lucide-react'
import { useMemo } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@white-label/ui'
import { useCustomers } from '@/lib/hooks/use-customers'
import type { Order } from '@/lib/hooks/use-orders'

interface OrderTableProps {
  orders: Order[]
  isLoading?: boolean
}

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL'
})

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
})

const getStatusBadgeVariant = (status: Order['status']) => {
  switch (status) {
    case 'pending':
      return 'secondary'
    case 'processing':
      return 'outline'
    case 'shipped':
      return 'success'
    case 'delivered':
      return 'success'
    case 'cancelled':
      return 'error'
    default:
      return 'secondary'
  }
}

const getStatusLabel = (status: Order['status']) => {
  switch (status) {
    case 'pending':
      return 'Pendente'
    case 'processing':
      return 'Processando'
    case 'shipped':
      return 'Enviado'
    case 'delivered':
      return 'Entregue'
    case 'cancelled':
      return 'Cancelado'
    default:
      return status
  }
}

const getPaymentStatusLabel = (status: Order['payment_status']) => {
  switch (status) {
    case 'pending':
      return 'Pendente'
    case 'paid':
      return 'Pago'
    case 'refunded':
      return 'Reembolsado'
    case 'failed':
      return 'Falhou'
    default:
      return status
  }
}

export function OrderTable({ orders, isLoading = false }: OrderTableProps) {
  const { data: customers } = useCustomers()
  const customersMap = useMemo(() => {
    if (!customers) return {}
    return customers.reduce((acc, customer) => {
      acc[customer.id] = customer
      return acc
    }, {} as Record<string, typeof customers[0]>)
  }, [customers])

  if (isLoading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-[#1D1D1D] dark:bg-[#0A0A0A]">
        <Table>
          <TableHeader>
            <TableRow className="dark:border-[#1D1D1D]">
              <TableHead className="dark:text-[#E0E0E0]">ID</TableHead>
              <TableHead className="dark:text-[#E0E0E0]">Data</TableHead>
              <TableHead className="dark:text-[#E0E0E0]">Cliente</TableHead>
              <TableHead className="dark:text-[#E0E0E0]">Status</TableHead>
              <TableHead className="dark:text-[#E0E0E0]">Pagamento</TableHead>
              <TableHead className="dark:text-[#E0E0E0]">Total</TableHead>
              <TableHead className="text-right dark:text-[#E0E0E0]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i} className="dark:border-[#1D1D1D]">
                <TableCell>
                  <div className="h-4 w-32 animate-pulse rounded bg-gray-200 dark:bg-[#1A1A1A]" />
                </TableCell>
                <TableCell>
                  <div className="h-4 w-24 animate-pulse rounded bg-gray-200 dark:bg-[#1A1A1A]" />
                </TableCell>
                <TableCell>
                  <div className="h-4 w-32 animate-pulse rounded bg-gray-200 dark:bg-[#1A1A1A]" />
                </TableCell>
                <TableCell>
                  <div className="h-6 w-20 animate-pulse rounded-full bg-gray-200 dark:bg-[#1A1A1A]" />
                </TableCell>
                <TableCell>
                  <div className="h-6 w-16 animate-pulse rounded-full bg-gray-200 dark:bg-[#1A1A1A]" />
                </TableCell>
                <TableCell>
                  <div className="h-4 w-20 animate-pulse rounded bg-gray-200 dark:bg-[#1A1A1A]" />
                </TableCell>
                <TableCell className="text-right">
                  <div className="ml-auto h-8 w-8 animate-pulse rounded bg-gray-200 dark:bg-[#1A1A1A]" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm dark:border-[#1D1D1D] dark:bg-[#0A0A0A]">
        <Package className="mx-auto h-12 w-12 text-gray-400 dark:text-[#777777]" />
        <p className="mt-4 text-sm font-medium text-gray-500 dark:text-[#CCCCCC]">Nenhum pedido encontrado</p>
        <p className="mt-1 text-xs text-gray-400 dark:text-[#B5B5B5]">
          Tente ajustar os filtros ou aguarde novos pedidos
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-[#1D1D1D] dark:bg-[#0A0A0A]">
      <Table>
        <TableHeader>
          <TableRow className="dark:border-[#1D1D1D] hover:bg-transparent">
            <TableHead className="dark:text-[#E0E0E0]">ID</TableHead>
            <TableHead className="dark:text-[#E0E0E0]">Data</TableHead>
            <TableHead className="dark:text-[#E0E0E0]">Cliente</TableHead>
            <TableHead className="dark:text-[#E0E0E0]">Status</TableHead>
            <TableHead className="dark:text-[#E0E0E0]">Pagamento</TableHead>
            <TableHead className="dark:text-[#E0E0E0]">Total</TableHead>
            <TableHead className="text-right dark:text-[#E0E0E0]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => {
            const customer = order.customer_id ? customersMap[order.customer_id] : null
            return (
              <TableRow key={order.id} className="dark:border-[#1D1D1D] dark:hover:bg-[#1A1A1A] even:dark:bg-[#111111]/30">
                <TableCell>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-gray-600 dark:text-[#B5B5B5]">
                    {dateFormatter.format(new Date(order.created_at))}
                  </span>
                </TableCell>
                <TableCell>
                  {customer ? (
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{customer.name}</p>
                      {customer.email && (
                        <p className="text-xs text-gray-500 dark:text-[#B5B5B5]">{customer.email}</p>
                      )}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400 dark:text-[#777777]">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(order.status)}>
                    {getStatusLabel(order.status)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={order.payment_status === 'paid' ? 'success' : 'secondary'}>
                    {getPaymentStatusLabel(order.payment_status)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {currencyFormatter.format(parseFloat(order.total))}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Link href={`/orders/${order.id}`}>
                    <Button variant="outline" className="h-8 w-8 p-0 dark:bg-[#111111] dark:border-[#2A2A2A] dark:hover:bg-[#1A1A1A] dark:text-white">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

