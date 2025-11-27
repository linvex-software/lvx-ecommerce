'use client'

import { useParams } from 'next/navigation'
import { toast } from 'sonner'
import { useOrder, useDownloadShippingLabel } from '@/lib/hooks/use-orders'
import { OrderDetails } from '@/components/orders/order-details'

export default function OrderDetailPage() {
  const params = useParams()
  const orderId = params.id as string
  const { data: order, isLoading } = useOrder(orderId)
  const downloadLabel = useDownloadShippingLabel()

  const handleDownloadLabel = async () => {
    if (!order?.shipping_label_url) return

    try {
      // Se for URL externa, abrir em nova aba
      if (order.shipping_label_url.startsWith('http://') || order.shipping_label_url.startsWith('https://')) {
        window.open(order.shipping_label_url, '_blank')
        return
      }

      // Se não for URL externa, tentar baixar via endpoint
      const blob = await downloadLabel.mutateAsync(orderId)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `etiqueta-${orderId}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Erro ao baixar etiqueta:', error)
      toast.error('Erro ao baixar etiqueta', {
        description: 'Não foi possível baixar a etiqueta. Tente novamente.'
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-sm font-light text-gray-500 tracking-wide">Carregando...</div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-sm font-medium text-gray-900">Pedido não encontrado</p>
        </div>
      </div>
    )
  }

  return <OrderDetails order={order} onDownloadLabel={handleDownloadLabel} isDownloading={downloadLabel.isPending} />
}

