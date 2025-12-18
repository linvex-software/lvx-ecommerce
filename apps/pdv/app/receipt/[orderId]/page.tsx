'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { apiClient } from '@/lib/api-client'
import { useStoreTheme } from '@/lib/hooks/use-store-theme'

interface OrderItem {
  id: string
  product_id: string
  variant_id: string | null
  quantity: number
  price: string
  product?: {
    name: string
    sku: string
  }
}

interface Order {
  id: string
  store_id: string
  customer_id: string | null
  total: string
  status: string
  payment_status: string
  shipping_cost: string
  shipping_address: any
  created_at: string
  items: OrderItem[]
  customer?: {
    name: string
    email: string | null
    cpf: string
    phone: string | null
  }
}

export default function ReceiptPage() {
  const params = useParams()
  const orderId = params.orderId as string
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const { data: storeTheme } = useStoreTheme()

  useEffect(() => {
    if (!orderId) return

    const fetchOrder = async () => {
      try {
        const response = await apiClient.get<{ order: Order }>(
          `/physical-sales/order/${orderId}/receipt`
        )
        setOrder(response.data.order)
      } catch (error) {
        console.error('Erro ao buscar pedido:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [orderId])

  const formatCurrency = (value: string | number) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(numValue)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getPdvMetadata = (shippingAddress: any) => {
    if (shippingAddress && shippingAddress._pdv_metadata) {
      return shippingAddress._pdv_metadata
    }
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Carregando recibo...</div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500">Pedido não encontrado</div>
      </div>
    )
  }

  const pdvMetadata = getPdvMetadata(order.shipping_address)
  const subtotal = order.items.reduce(
    (sum, item) => sum + parseFloat(item.price) * item.quantity,
    0
  )
  const discount = subtotal - parseFloat(order.total) + parseFloat(order.shipping_cost)

  return (
    <div className="min-h-screen bg-white p-8 print:p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 border-b border-gray-200 pb-6">
          {storeTheme?.logo_url && (
            <img
              src={storeTheme.logo_url}
              alt="Logo"
              className="h-16 w-auto mx-auto mb-4"
            />
          )}
          <h1 className="text-2xl font-bold text-gray-900">RECIBO DE VENDA</h1>
          <p className="text-sm text-gray-500 mt-2">Pedido #{order.id.slice(0, 8).toUpperCase()}</p>
        </div>

        {/* Informações do Pedido */}
        <div className="mb-6 space-y-4">
          <div>
            <p className="text-sm text-gray-500">Data/Hora:</p>
            <p className="font-medium">{formatDate(order.created_at)}</p>
          </div>

          {order.customer && (
            <div>
              <p className="text-sm text-gray-500">Cliente:</p>
              <p className="font-medium">{order.customer.name}</p>
              {order.customer.email && (
                <p className="text-sm text-gray-600">{order.customer.email}</p>
              )}
              {order.customer.phone && (
                <p className="text-sm text-gray-600">{order.customer.phone}</p>
              )}
              <p className="text-sm text-gray-600">CPF: {order.customer.cpf}</p>
            </div>
          )}

          {pdvMetadata && (
            <div>
              <p className="text-sm text-gray-500">Origem:</p>
              <p className="font-medium capitalize">
                {pdvMetadata.origin === 'pdv' ? 'PDV / Balcão' : pdvMetadata.origin}
              </p>
            </div>
          )}

          <div>
            <p className="text-sm text-gray-500">Status do Pagamento:</p>
            <p
              className={`font-medium ${
                order.payment_status === 'paid'
                  ? 'text-green-600'
                  : order.payment_status === 'failed'
                  ? 'text-red-600'
                  : 'text-yellow-600'
              }`}
            >
              {order.payment_status === 'paid'
                ? 'Pago'
                : order.payment_status === 'failed'
                ? 'Falhou'
                : 'Pendente'}
            </p>
          </div>
        </div>

        {/* Itens */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4 border-b border-gray-200 pb-2">
            Itens
          </h2>
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 text-sm font-semibold text-gray-700">Produto</th>
                <th className="text-center py-2 text-sm font-semibold text-gray-700">Qtd</th>
                <th className="text-right py-2 text-sm font-semibold text-gray-700">Preço</th>
                <th className="text-right py-2 text-sm font-semibold text-gray-700">Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, index) => (
                <tr key={index} className="border-b border-gray-100">
                  <td className="py-3">
                    <div>
                      <p className="font-medium text-gray-900">
                        {item.product?.name || `Produto ${item.product_id.slice(0, 8)}`}
                      </p>
                      {item.product?.sku && (
                        <p className="text-xs text-gray-500">SKU: {item.product.sku}</p>
                      )}
                    </div>
                  </td>
                  <td className="text-center py-3">{item.quantity}</td>
                  <td className="text-right py-3">{formatCurrency(item.price)}</td>
                  <td className="text-right py-3 font-medium">
                    {formatCurrency(parseFloat(item.price) * item.quantity)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totais */}
        <div className="mb-6 border-t border-gray-200 pt-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium">{formatCurrency(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm text-red-600">
                <span>Desconto:</span>
                <span>-{formatCurrency(discount)}</span>
              </div>
            )}
            {parseFloat(order.shipping_cost) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Frete:</span>
                <span className="font-medium">{formatCurrency(order.shipping_cost)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold border-t border-gray-300 pt-2">
              <span>Total:</span>
              <span>{formatCurrency(order.total)}</span>
            </div>
            {pdvMetadata?.commission_rate && (
              <div className="flex justify-between text-xs text-gray-500">
                <span>Comissão ({pdvMetadata.commission_rate}%):</span>
                <span>
                  {formatCurrency(
                    (parseFloat(order.total) * pdvMetadata.commission_rate) / 100
                  )}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500 border-t border-gray-200 pt-4">
          <p>Este é um recibo de venda gerado automaticamente.</p>
          <p className="mt-1">Obrigado pela preferência!</p>
        </div>

        {/* Botão de Impressão (oculto na impressão) */}
        <div className="mt-8 text-center print:hidden">
          <button
            onClick={() => window.print()}
            className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Imprimir Recibo
          </button>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body {
            background: white;
          }
          .print\\:hidden {
            display: none;
          }
        }
      `}</style>
    </div>
  )
}

