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
      return 'destructive'
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
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Pagamento</TableHead>
              <TableHead>Total</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
                </TableCell>
                <TableCell>
                  <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
                </TableCell>
                <TableCell>
                  <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
                </TableCell>
                <TableCell>
                  <div className="h-6 w-20 animate-pulse rounded-full bg-gray-200" />
                </TableCell>
                <TableCell>
                  <div className="h-6 w-16 animate-pulse rounded-full bg-gray-200" />
                </TableCell>
                <TableCell>
                  <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
                </TableCell>
                <TableCell className="text-right">
                  <div className="ml-auto h-8 w-8 animate-pulse rounded bg-gray-200" />
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
      <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm">
        <Package className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-4 text-sm font-medium text-gray-500">Nenhum pedido encontrado</p>
        <p className="mt-1 text-xs text-gray-400">
          Tente ajustar os filtros ou aguarde novos pedidos
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Pagamento</TableHead>
            <TableHead>Total</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => {
            const customer = order.customer_id ? customersMap[order.customer_id] : null
            return (
              <TableRow key={order.id}>
                <TableCell>
                  <div>
                    <p className="font-medium text-gray-900">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-gray-600">
                    {dateFormatter.format(new Date(order.created_at))}
                  </span>
                </TableCell>
                <TableCell>
                  {customer ? (
                    <div>
                      <p className="text-sm font-medium text-gray-900">{customer.name}</p>
                      {customer.email && (
                        <p className="text-xs text-gray-500">{customer.email}</p>
                      )}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">-</span>
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
                  <span className="font-medium text-gray-900">
                    {currencyFormatter.format(parseFloat(order.total))}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Link href={`/orders/${order.id}`}>
                    <Button variant="outline" className="h-8 w-8 p-0">
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

