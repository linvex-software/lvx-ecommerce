'use client'

import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useState } from 'react'
import { useOrder, useDownloadShippingLabel } from '@/lib/hooks/use-orders'
import { useCancelOrder } from '@/lib/hooks/use-cancel-order'
import { OrderDetails } from '@/components/orders/order-details'

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.id as string
  const { data: order, isLoading } = useOrder(orderId)
  const downloadLabel = useDownloadShippingLabel()
  const cancelOrder = useCancelOrder()
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [cancelReason, setCancelReason] = useState('')

  const handleCancelOrder = async () => {
    try {
      const result = await cancelOrder.mutateAsync({ 
        orderId, 
        reason: cancelReason || null 
      })
      
      toast.success('Pedido cancelado!', {
        description: result.message
      })
      
      setShowCancelDialog(false)
      setCancelReason('')
    } catch (error: any) {
      console.error('Erro ao cancelar pedido:', error)
      toast.error('Erro ao cancelar pedido', {
        description: error.response?.data?.error || 'Não foi possível cancelar o pedido.'
      })
    }
  }

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
        <div className="text-sm font-light text-muted-foreground tracking-wide">Carregando...</div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">Pedido não encontrado</p>
        </div>
      </div>
    )
  }

  return (
    <OrderDetails 
      order={order} 
      onDownloadLabel={handleDownloadLabel} 
      isDownloading={downloadLabel.isPending}
      onCancelOrder={() => setShowCancelDialog(true)}
      isCancelling={cancelOrder.isPending}
      showCancelDialog={showCancelDialog}
      onCloseCancelDialog={() => setShowCancelDialog(false)}
      onConfirmCancel={handleCancelOrder}
      cancelReason={cancelReason}
      onCancelReasonChange={setCancelReason}
    />
  )
}

