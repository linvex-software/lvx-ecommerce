'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Printer, Home } from 'lucide-react'
import { Button } from '@white-label/ui'
import { StepProgress } from '@/components/pdv/step-progress'
import { usePDV } from '@/context/pdv-context'
import { apiClient } from '@/lib/api-client'
import { useStoreTheme } from '@/lib/hooks/use-store-theme'
import { maskCPF, maskPhone } from '@/lib/utils/masks'
import toast from 'react-hot-toast'

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

export default function ReceiptStepPage() {
  const router = useRouter()
  const { state, reset } = usePDV()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const { data: storeTheme } = useStoreTheme()

  useEffect(() => {
    if (!state.orderId) {
      router.push('/pdv/client')
      return
    }

    const fetchOrder = async () => {
      try {
        const response = await apiClient.get<{ order: Order }>(
          `/physical-sales/order/${state.orderId}/receipt`
        )
        setOrder(response.data.order)
      } catch (error) {
        console.error('Erro ao buscar pedido:', error)
        toast.error('Erro ao carregar recibo')
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [state.orderId, router])

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

  const handlePrint = () => {
    window.print()
  }

  const handleNewSale = () => {
    reset()
    router.push('/pdv/client')
  }

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <StepProgress currentStep="receipt" />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-gray-500 dark:text-gray-400">Carregando recibo...</div>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <StepProgress currentStep="receipt" />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-red-500 dark:text-red-400">Pedido não encontrado</div>
        </div>
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
    <>
      <div className="w-full max-w-4xl mx-auto">
        <StepProgress currentStep="receipt" />

        <div className="p-4 md:p-8">
          {/* Recibo - Área de Impressão */}
          <div
            id="receipt-print-area"
            className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg max-w-[380px] mx-auto print:max-w-full print:shadow-none print:border-0"
          >
            {/* Cabeçalho */}
            <div className="text-center mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
              {storeTheme?.logo_url && (
                <img
                  src={storeTheme.logo_url}
                  alt="Logo"
                  className="h-16 w-auto mx-auto mb-4 print:h-14"
                />
              )}
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                RECIBO DE VENDA
              </h1>
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <p>Pedido #{order.id.slice(0, 8).toUpperCase()}</p>
                <p>{formatDate(order.created_at)}</p>
              </div>
            </div>

            {/* Informações da Venda */}
            <div className="mb-6 space-y-4 text-sm">
              {order.customer && (
                <div className="pb-3 border-b border-gray-100 dark:border-gray-700">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                    Cliente
                  </p>
                  <p className="font-semibold text-gray-900 dark:text-white text-base">
                    {order.customer.name}
                  </p>
                  {order.customer.email && (
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      {order.customer.email}
                    </p>
                  )}
                  {order.customer.phone && (
                    <p className="text-gray-600 dark:text-gray-400">
                      {maskPhone(order.customer.phone)}
                    </p>
                  )}
                  {order.customer.cpf && (
                    <p className="text-gray-600 dark:text-gray-400">
                      CPF: {maskCPF(order.customer.cpf)}
                    </p>
                  )}
                </div>
              )}

              {pdvMetadata && (
                <div className="space-y-3 pb-3 border-b border-gray-100 dark:border-gray-700">
                  {state.vendorName && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                        Vendedor
                      </p>
                      <p className="text-gray-900 dark:text-white">{state.vendorName}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                      Origem
                    </p>
                    <p className="text-gray-900 dark:text-white capitalize">
                      {pdvMetadata.origin === 'pdv' ? 'PDV / Balcão' : pdvMetadata.origin}
                    </p>
                  </div>
                  {pdvMetadata.payment_method && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                        Pagamento
                      </p>
                      <p className="text-gray-900 dark:text-white capitalize">
                        {pdvMetadata.payment_method === 'credit_card'
                          ? 'Cartão de Crédito'
                          : pdvMetadata.payment_method === 'debit_card'
                          ? 'Cartão de Débito'
                          : pdvMetadata.payment_method === 'cash'
                          ? 'Dinheiro'
                          : pdvMetadata.payment_method === 'pix'
                          ? 'PIX'
                          : 'Outro'}
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                  Status
                </p>
                <p
                  className={`font-semibold ${
                    order.payment_status === 'paid'
                      ? 'text-green-600 dark:text-green-400'
                      : order.payment_status === 'failed'
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-yellow-600 dark:text-yellow-400'
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

            {/* Tabela de Itens */}
            <div className="mb-6">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-3 pb-2 border-b border-gray-200 dark:border-gray-700 uppercase tracking-wide">
                Itens
              </h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-2 font-semibold text-gray-700 dark:text-gray-300">
                      Produto
                    </th>
                    <th className="text-center py-2 font-semibold text-gray-700 dark:text-gray-300 w-12">
                      Qtd
                    </th>
                    <th className="text-right py-2 font-semibold text-gray-700 dark:text-gray-300">
                      Unit.
                    </th>
                    <th className="text-right py-2 font-semibold text-gray-700 dark:text-gray-300">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item, index) => (
                    <tr
                      key={index}
                      className="border-b border-gray-100 dark:border-gray-700 last:border-0"
                    >
                      <td className="py-3">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {item.product?.name || `Produto ${item.product_id.slice(0, 8)}`}
                          </p>
                          {item.product?.sku && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              SKU: {item.product.sku}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="text-center py-3 text-gray-900 dark:text-white">
                        {item.quantity}
                      </td>
                      <td className="text-right py-3 text-gray-600 dark:text-gray-400">
                        {formatCurrency(item.price)}
                      </td>
                      <td className="text-right py-3 font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(parseFloat(item.price) * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totais */}
            <div className="mb-6 border-t-2 border-gray-300 dark:border-gray-600 pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(subtotal)}
                </span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm text-red-600 dark:text-red-400">
                  <span>Desconto:</span>
                  <span className="font-semibold">-{formatCurrency(discount)}</span>
                </div>
              )}
              {parseFloat(order.shipping_cost) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Frete:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(order.shipping_cost)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
                <span className="text-gray-900 dark:text-white">Total:</span>
                <span className="text-gray-900 dark:text-white">{formatCurrency(order.total)}</span>
              </div>
            </div>

            {/* Rodapé */}
            <div className="text-center text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-4 space-y-1">
              <p>Este é um recibo de venda gerado automaticamente.</p>
              <p className="font-semibold">Obrigado pela preferência!</p>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="mt-6 flex flex-col sm:flex-row gap-3 print:hidden max-w-[380px] mx-auto">
            <Button
              onClick={handlePrint}
              className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white text-base font-semibold shadow-lg hover:shadow-xl transition-all"
              size="lg"
            >
              <Printer className="mr-2 h-5 w-5" />
              Imprimir Recibo
            </Button>
            <Button
              onClick={handleNewSale}
              variant="outline"
              className="flex-1 h-12 text-base font-semibold border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
              size="lg"
            >
              <Home className="mr-2 h-5 w-5" />
              Nova Venda
            </Button>
          </div>
        </div>
      </div>

      {/* CSS de Impressão */}
      <style jsx global>{`
        @media print {
          /* Esconder tudo */
          body * {
            visibility: hidden !important;
          }

          /* Mostrar só o recibo */
          #receipt-print-area,
          #receipt-print-area * {
            visibility: visible !important;
          }

          #receipt-print-area {
            position: absolute;
            inset: 0;
            max-width: 380px;
            margin: 0 auto;
            padding: 20px;
            background: white;
            box-shadow: none;
            border: none;
          }

          /* Esconder elementos não necessários na impressão */
          header,
          nav,
          .print\\:hidden,
          [class*='print:hidden'] {
            display: none !important;
            visibility: hidden !important;
          }

          /* Ajustes de tipografia para impressão */
          #receipt-print-area {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            font-size: 12px;
            line-height: 1.5;
            color: #000;
          }

          #receipt-print-area h1 {
            font-size: 18px;
            font-weight: 700;
          }

          #receipt-print-area h2 {
            font-size: 14px;
            font-weight: 600;
          }

          #receipt-print-area table {
            font-size: 11px;
          }

          /* Quebra de página */
          @page {
            size: auto;
            margin: 0;
          }
        }

        /* Estilos para dark mode no recibo */
        @media (prefers-color-scheme: dark) {
          #receipt-print-area {
            background: white;
            color: #000;
          }
        }
      `}</style>
    </>
  )
}
