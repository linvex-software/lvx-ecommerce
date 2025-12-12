'use client'

import { use } from 'react'
import Link from 'next/link'
import { useCustomerOrder } from '@/lib/hooks/use-customer-orders'
import { Button } from '@/components/ui/button'
import { Package } from 'lucide-react'
import { AccountNavMenu } from '@/components/account/AccountNavMenu'
import { AccountBreadcrumb } from '@/components/account/AccountBreadcrumb'
import { OrderTimeline, type OrderStatus, type PaymentStatus } from '@/components/account/order-timeline'

export default function PedidoDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { data: order, isLoading } = useCustomerOrder(id)

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
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (isLoading) {
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
                      { label: 'Meus Pedidos', href: '/minha-conta/pedidos' },
                      { label: 'Detalhes' },
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

  if (!order) {
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
                      { label: 'Meus Pedidos', href: '/minha-conta/pedidos' },
                      { label: 'Detalhes' },
                    ]}
                  />
                </div>
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12 text-center">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">Pedido não encontrado</p>
                  <Link href="/minha-conta/pedidos">
                    <Button>Voltar para pedidos</Button>
                  </Link>
                </div>
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
                    { label: 'Meus Pedidos', href: '/minha-conta/pedidos' },
                    { label: `Pedido #${order.id.slice(0, 8).toUpperCase()}` },
                  ]}
                />
              </div>

              {/* Timeline do Pedido */}
              <div className="mb-6">
                <OrderTimeline
                  status={order.status as OrderStatus}
                  paymentStatus={order.payment_status as PaymentStatus}
                  createdAt={order.created_at}
                />
              </div>

              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 mb-6">
                <div className="flex items-center justify-between mb-6">
                  <h1 className="text-2xl font-bold text-gray-900">
                    Pedido #{order.id.slice(0, 8).toUpperCase()}
                  </h1>
                  <span className="text-sm text-gray-600">
                    {formatDate(order.created_at)}
                  </span>
                </div>

                {order.tracking_code && (
                  <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
                    <p className="text-sm text-gray-600 mb-1">Código de Rastreamento</p>
                    <p className="font-semibold text-blue-900">{order.tracking_code}</p>
                  </div>
                )}

                <div className="border-t pt-6">
                  <h2 className="font-semibold text-lg mb-4">Itens do Pedido</h2>
                  <div className="space-y-4">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{item.product_name}</p>
                          <p className="text-sm text-gray-600">
                            Quantidade: {item.quantity} • {formatCurrency(item.price)} cada
                          </p>
                        </div>
                        <p className="font-semibold">
                          {formatCurrency(
                            (parseFloat(item.price) * item.quantity).toString()
                          )}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t mt-6 pt-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Subtotal</span>
                    <span>{formatCurrency(order.total)}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Frete</span>
                    <span>{formatCurrency(order.shipping_cost || '0')}</span>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t font-bold text-lg">
                    <span>Total</span>
                    <span>{formatCurrency(order.total)}</span>
                  </div>
                </div>

                {order.shipping_address && (
                  <div className="border-t mt-6 pt-6">
                    <h2 className="font-semibold text-lg mb-4">Endereço de Entrega</h2>
                    <div className="text-gray-600">
                      <p>{order.shipping_address.street}</p>
                      {order.shipping_address.complement && (
                        <p>{order.shipping_address.complement}</p>
                      )}
                      {order.shipping_address.neighborhood && (
                        <p>{order.shipping_address.neighborhood}</p>
                      )}
                      <p>
                        {order.shipping_address.city} - {order.shipping_address.state}
                      </p>
                      <p>CEP: {order.shipping_address.zip_code}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

