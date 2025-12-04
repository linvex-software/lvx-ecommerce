'use client'

import Link from 'next/link'
import { useCustomerOrders } from '@/lib/hooks/use-customer-orders'
import { Button } from '@/components/ui/button'
import { Package } from 'lucide-react'
import { AccountNavMenu } from '@/components/account/AccountNavMenu'
import { AccountBreadcrumb } from '@/components/account/AccountBreadcrumb'

export default function PedidosPage() {
  const { data: orders, isLoading } = useCustomerOrders()

  const formatStatus = (status: string) => {
    const statusMap: Record<string, string> = {
      created: 'Criado',
      paid: 'Pago',
      cancelled: 'Cancelado',
      shipped: 'Enviado',
      delivered: 'Entregue',
    }
    return statusMap[status] || status
  }

  const formatPaymentStatus = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: 'Pendente',
      paid: 'Pago',
      cancelled: 'Cancelado',
      refunded: 'Reembolsado',
    }
    return statusMap[status] || status
  }

  const formatCurrency = (value: string) => {
    const num = parseFloat(value)
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(num)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="py-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row gap-6 pt-16 lg:pt-0">
              <AccountNavMenu />
              <div className="flex-1">
                <div className="flex justify-center mb-6">
                  <AccountBreadcrumb
                    items={[
                      { label: 'Home', href: '/' },
                      { label: 'Área do Cliente', href: '/minha-conta' },
                      { label: 'Meus Pedidos' },
                    ]}
                  />
                </div>
                <p>Carregando...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row items-start gap-6 pt-16 lg:pt-0">
              <AccountNavMenu />
              
              <div className="flex-1">
              <div className="flex justify-center mb-6">
                <AccountBreadcrumb
                  items={[
                    { label: 'Home', href: '/' },
                    { label: 'Área do Cliente', href: '/minha-conta' },
                    { label: 'Meus Pedidos' },
                  ]}
                />
              </div>
              
              <h1 className="text-2xl font-bold text-gray-900 mb-6">Meus Pedidos</h1>

        {orders && orders.length > 0 ? (
          <div className="space-y-4">
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/minha-conta/pedidos/${order.id}`}
                className="block bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <h3 className="font-semibold text-gray-900">
                        Pedido #{order.id.slice(0, 8).toUpperCase()}
                      </h3>
                      <span className="text-sm text-gray-600">
                        {formatDate(order.created_at)}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 mb-2">
                      <span className="text-sm">
                        <span className="text-gray-600">Status: </span>
                        <span className="font-medium">{formatStatus(order.status)}</span>
                      </span>
                      <span className="text-sm">
                        <span className="text-gray-600">Pagamento: </span>
                        <span className="font-medium">
                          {formatPaymentStatus(order.payment_status)}
                        </span>
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 mb-2">
                      {order.items.length} item(s) • Total: {formatCurrency(order.total)}
                    </p>

                    {order.tracking_code && (
                      <p className="text-sm text-blue-600">
                        Código de rastreamento: {order.tracking_code}
                      </p>
                    )}
                  </div>

                  <Button variant="ghost" size="sm">
                    Ver detalhes
                  </Button>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Você ainda não realizou nenhum pedido</p>
            <Link href="/">
              <Button>Ir para a loja</Button>
            </Link>
          </div>
        )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

