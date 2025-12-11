'use client'

import { Package, Truck, CheckCircle2, XCircle, Clock } from 'lucide-react'

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
export type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'failed'

interface OrderTimelineProps {
  status: OrderStatus
  paymentStatus: PaymentStatus
  createdAt: string
}

interface TimelineStep {
  id: OrderStatus
  label: string
  icon: React.ElementType
  completed: boolean
  current: boolean
}

export function OrderTimeline({ status, paymentStatus, createdAt }: OrderTimelineProps) {
  // Se pagamento falhou ou pedido cancelado, mostrar estado especial
  if (paymentStatus === 'failed' || status === 'cancelled') {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <div className="flex items-center gap-3">
          <XCircle className="h-6 w-6 text-red-600" />
          <div>
            <h3 className="font-semibold text-red-900">
              {paymentStatus === 'failed' ? 'Pagamento Falhou' : 'Pedido Cancelado'}
            </h3>
            <p className="text-sm text-red-700">
              {paymentStatus === 'failed'
                ? 'Não foi possível processar o pagamento. Entre em contato para mais informações.'
                : 'Este pedido foi cancelado.'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Se reembolsado
  if (paymentStatus === 'refunded') {
    return (
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-6 w-6 text-blue-600" />
          <div>
            <h3 className="font-semibold text-blue-900">Pedido Reembolsado</h3>
            <p className="text-sm text-blue-700">
              O valor deste pedido foi reembolsado.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Timeline normal
  const steps: TimelineStep[] = [
    {
      id: 'pending',
      label: 'Pedido Criado',
      icon: Clock,
      completed: true,
      current: status === 'pending' && paymentStatus === 'pending'
    },
    {
      id: 'processing',
      label: 'Em Separação',
      icon: Package,
      completed: ['processing', 'shipped', 'delivered'].includes(status) && paymentStatus === 'paid',
      current: status === 'processing' && paymentStatus === 'paid'
    },
    {
      id: 'shipped',
      label: 'Em Transporte',
      icon: Truck,
      completed: ['shipped', 'delivered'].includes(status),
      current: status === 'shipped'
    },
    {
      id: 'delivered',
      label: 'Entregue',
      icon: CheckCircle2,
      completed: status === 'delivered',
      current: status === 'delivered'
    }
  ]

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h3 className="mb-6 text-lg font-semibold text-gray-900">Status do Pedido</h3>
      
      {/* Aguardando pagamento */}
      {paymentStatus === 'pending' && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-600" />
            <p className="text-sm font-medium text-amber-900">
              Aguardando confirmação do pagamento
            </p>
          </div>
        </div>
      )}

      <div className="relative">
        {steps.map((step, index) => {
          const Icon = step.icon
          const isLast = index === steps.length - 1

          return (
            <div key={step.id} className="relative flex gap-4 pb-8 last:pb-0">
              {/* Linha vertical */}
              {!isLast && (
                <div
                  className={`absolute left-[15px] top-[32px] h-[calc(100%-16px)] w-0.5 ${
                    step.completed ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                />
              )}

              {/* Ícone */}
              <div
                className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                  step.completed
                    ? 'border-green-500 bg-green-500 text-white'
                    : step.current
                    ? 'border-blue-500 bg-blue-50 text-blue-600'
                    : 'border-gray-300 bg-white text-gray-400'
                }`}
              >
                <Icon className="h-4 w-4" />
              </div>

              {/* Conteúdo */}
              <div className="flex-1 pt-0.5">
                <p
                  className={`font-medium ${
                    step.completed || step.current ? 'text-gray-900' : 'text-gray-500'
                  }`}
                >
                  {step.label}
                </p>
                {step.current && (
                  <p className="mt-1 text-sm text-gray-600">
                    Status atual do seu pedido
                  </p>
                )}
                {step.completed && step.id === 'pending' && (
                  <p className="mt-1 text-xs text-gray-500">
                    {new Date(createdAt).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Mensagem de entrega */}
      {status === 'delivered' && (
        <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <p className="text-sm font-medium text-green-900">
              Pedido entregue com sucesso!
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

