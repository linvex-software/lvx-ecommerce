'use client'

import Link from 'next/link'
import { ArrowLeft, Package, Download, ExternalLink, User, Printer, MapPin, Copy, Check } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button } from '@white-label/ui'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCustomers } from '@/lib/hooks/use-customers'
import { useUpdateOrder, type Order, type OrderStatus, type PaymentStatus } from '@/lib/hooks/use-orders'

interface OrderDetailsProps {
  order: Order
  onDownloadLabel: () => void
  isDownloading?: boolean
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

export function OrderDetails({ order, onDownloadLabel, isDownloading = false }: OrderDetailsProps) {
  const { data: customers } = useCustomers()
  const updateOrderMutation = useUpdateOrder()
  const [copiedAddress, setCopiedAddress] = useState(false)
  
  const customer = useMemo(() => {
    if (!order.customer_id || !customers) return null
    return customers.find((c) => c.id === order.customer_id) || null
  }, [order.customer_id, customers])

  const hasShippingLabel = !!order.shipping_label_url
  const isExternalUrl = order.shipping_label_url?.startsWith('http://') || order.shipping_label_url?.startsWith('https://')

  const getDeliveryTypeLabel = (type: Order['delivery_type']) => {
    switch (type) {
      case 'shipping':
        return 'Entrega'
      case 'pickup_point':
        return 'Retirada no Ponto'
      default:
        return 'Não informado'
    }
  }

  const handleStatusChange = async (newStatus: OrderStatus) => {
    await updateOrderMutation.mutateAsync({
      orderId: order.id,
      data: { status: newStatus }
    })
  }

  const handlePaymentStatusChange = async (newPaymentStatus: PaymentStatus) => {
    await updateOrderMutation.mutateAsync({
      orderId: order.id,
      data: { payment_status: newPaymentStatus }
    })
  }

  const handleCopyAddress = () => {
    if (!order.shipping_address) return
    
    const address = [
      order.shipping_address.street,
      order.shipping_address.number,
      order.shipping_address.complement,
      order.shipping_address.neighborhood,
      order.shipping_address.city,
      order.shipping_address.state,
      order.shipping_address.zip_code,
    ].filter(Boolean).join(', ')

    navigator.clipboard.writeText(address)
    setCopiedAddress(true)
    setTimeout(() => setCopiedAddress(false), 2000)
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between print:justify-start">
        <div className="flex items-center gap-4">
          <Link href="/orders" className="print:hidden">
            <Button variant="outline" className="h-10 w-10 p-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-4xl font-light tracking-tight text-gray-900">
              Pedido #{order.id.slice(0, 8).toUpperCase()}
            </h1>
            <p className="mt-2 text-sm font-light text-gray-500">
              Criado em {dateFormatter.format(new Date(order.created_at))}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 print:hidden">
          <Button
            variant="outline"
            onClick={handlePrint}
            className="gap-2"
          >
            <Printer className="h-4 w-4" />
            Imprimir
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Informações principais */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informações do cliente */}
          {customer && (
            <Card className="rounded-2xl border-gray-100 p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <User className="h-5 w-5 text-gray-400" />
                <h2 className="text-lg font-semibold text-gray-900">Cliente</h2>
              </div>
              <div className="space-y-2 text-sm">
                <p className="font-medium text-gray-900">{customer.name}</p>
                {customer.email && <p className="text-gray-600">{customer.email}</p>}
                {customer.phone && <p className="text-gray-600">{customer.phone}</p>}
                {customer.cpf && (
                  <p className="text-gray-500">
                    CPF: {customer.cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4')}
                  </p>
                )}
              </div>
            </Card>
          )}

          {/* Status e pagamento */}
          <Card className="rounded-2xl border-gray-100 p-6 shadow-sm print:shadow-none">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Status do Pedido</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-gray-600">Status:</span>
                <Select 
                  value={order.status} 
                  onValueChange={handleStatusChange}
                  disabled={updateOrderMutation.isPending}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="processing">Em Separação</SelectItem>
                    <SelectItem value="shipped">Enviado</SelectItem>
                    <SelectItem value="delivered">Entregue</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-gray-600">Pagamento:</span>
                <Select 
                  value={order.payment_status} 
                  onValueChange={handlePaymentStatusChange}
                  disabled={updateOrderMutation.isPending}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="paid">Pago</SelectItem>
                    <SelectItem value="refunded">Reembolsado</SelectItem>
                    <SelectItem value="failed">Falhou</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Tipo de Entrega:</span>
                <span className="text-sm font-medium text-gray-900">
                  {getDeliveryTypeLabel(order.delivery_type)}
                </span>
              </div>
            </div>
          </Card>

          {/* Itens do pedido */}
          {order.items && order.items.length > 0 && (
            <Card className="rounded-2xl border-gray-100 p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">Itens do Pedido</h2>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {item.product_name || `Produto ${item.product_id.slice(0, 8)}`}
                      </p>
                      <p className="text-xs text-gray-500">Quantidade: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      {currencyFormatter.format(parseFloat(item.price))}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Endereço de entrega */}
          {order.shipping_address && (
            <Card className="rounded-2xl border-gray-100 p-6 shadow-sm print:shadow-none">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-gray-400" />
                  <h2 className="text-lg font-semibold text-gray-900">Endereço de Entrega</h2>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyAddress}
                  className="gap-2 print:hidden"
                >
                  {copiedAddress ? (
                    <>
                      <Check className="h-4 w-4 text-green-600" />
                      Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copiar
                    </>
                  )}
                </Button>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                {order.shipping_address.street && (
                  <p>
                    {order.shipping_address.street}
                    {order.shipping_address.number && `, ${order.shipping_address.number}`}
                    {order.shipping_address.complement && ` - ${order.shipping_address.complement}`}
                  </p>
                )}
                {order.shipping_address.neighborhood && (
                  <p>{order.shipping_address.neighborhood}</p>
                )}
                {(order.shipping_address.city || order.shipping_address.state) && (
                  <p>
                    {order.shipping_address.city}
                    {order.shipping_address.state && `, ${order.shipping_address.state}`}
                  </p>
                )}
                {order.shipping_address.zip_code && (
                  <p className="font-medium">CEP: {order.shipping_address.zip_code.replace(/^(\d{5})(\d{3})$/, '$1-$2')}</p>
                )}
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar - Frete e etiqueta */}
        <div className="space-y-6">
          {/* Resumo financeiro */}
          <Card className="rounded-2xl border-gray-100 p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Resumo</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Subtotal:</span>
                <span className="text-sm font-medium text-gray-900">
                  {currencyFormatter.format(parseFloat(order.total) - parseFloat(order.shipping_cost))}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Frete:</span>
                <span className="text-sm font-medium text-gray-900">
                  {currencyFormatter.format(parseFloat(order.shipping_cost))}
                </span>
              </div>
              <div className="border-t border-gray-200 pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-base font-semibold text-gray-900">Total:</span>
                  <span className="text-base font-semibold text-gray-900">
                    {currencyFormatter.format(parseFloat(order.total))}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Informações de frete */}
          <Card className="rounded-2xl border-gray-100 p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Entrega</h2>
            <div className="space-y-4">
              {order.tracking_code ? (
                <div>
                  <p className="mb-2 text-sm font-medium text-gray-900">Código de Rastreio</p>
                  <p className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 font-mono text-sm text-gray-900">
                    {order.tracking_code}
                  </p>
                </div>
              ) : (
                <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-center text-sm text-gray-500">
                  Sem código de rastreio
                </div>
              )}

              {hasShippingLabel && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-900">Etiqueta de Frete</p>
                  <div className="flex gap-2">
                    {isExternalUrl ? (
                      <Button
                        variant="outline"
                        className="flex-1 gap-2"
                        onClick={() => window.open(order.shipping_label_url!, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                        Ver Etiqueta
                      </Button>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          className="flex-1 gap-2"
                          onClick={() => window.open(order.shipping_label_url!, '_blank')}
                          disabled={!order.shipping_label_url}
                        >
                          <ExternalLink className="h-4 w-4" />
                          Ver
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1 gap-2"
                          onClick={onDownloadLabel}
                          disabled={isDownloading || !order.shipping_label_url}
                        >
                          <Download className="h-4 w-4" />
                          {isDownloading ? 'Baixando...' : 'Baixar PDF'}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {!hasShippingLabel && (
                <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-center text-sm text-gray-500">
                  Etiqueta não disponível
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
 