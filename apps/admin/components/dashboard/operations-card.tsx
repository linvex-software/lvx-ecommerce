'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface OperationsCardProps {
  pendingOrders: number
  awaitingShipment: number
  lowStock: number
}

export function OperationsCard({
  pendingOrders,
  awaitingShipment,
  lowStock
}: OperationsCardProps) {
  const items = [
    {
      label: 'Pedidos pendentes',
      value: pendingOrders,
      helper: 'Aguardando confirmação de pagamento'
    },
    {
      label: 'Pagos aguardando expedição',
      value: awaitingShipment,
      helper: 'Organize a expedição nas próximas horas'
    },
    {
      label: 'Estoque baixo',
      value: lowStock,
      helper: 'Produtos abaixo do limite mínimo'
    }
  ]

  return (
    <Card className="h-full rounded-2xl border-gray-100 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base font-semibold text-gray-900">
          Status operacional
        </CardTitle>
        <p className="text-sm text-gray-500">
          Controle diário dos pedidos e alertas críticos
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((item) => (
          <div key={item.label} className="rounded-xl border border-gray-100 bg-gray-50/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-gray-400">
              {item.label}
            </p>
            <p className="mt-2 text-2xl font-semibold text-gray-900">{item.value}</p>
            <p className="text-sm text-gray-500">{item.helper}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}


