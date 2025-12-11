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
    <Card className="h-full dark:bg-surface-2 dark:border-[#1D1D1D]">
      <CardHeader>
        <CardTitle className="text-base font-semibold text-text-primary dark:text-white">
          Status operacional
        </CardTitle>
        <p className="text-sm text-text-secondary dark:text-[#B5B5B5]">
          Controle diário dos pedidos e alertas críticos
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((item) => (
          <div key={item.label} className="rounded-xl border border-border bg-surface p-4 dark:bg-[#111111] dark:border-[#1D1D1D]">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-text-tertiary">
              {item.label}
            </p>
            <p className="mt-2 text-2xl font-semibold text-text-primary dark:text-white">{item.value}</p>
            <p className="text-sm text-text-secondary dark:text-[#B5B5B5]">{item.helper}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}


