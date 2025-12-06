'use client'

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@white-label/ui'

interface SalesPoint {
  date: string
  amount: number
}

interface SalesChartProps {
  data: SalesPoint[]
  isLoading?: boolean
  period?: 7 | 30
  onPeriodChange?: (period: 7 | 30) => void
  totalRevenue?: number
}

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0
})

export function SalesChart({ 
  data, 
  isLoading = false, 
  period = 7, 
  onPeriodChange,
  totalRevenue = 0 
}: SalesChartProps) {
  const average = data.reduce((acc, point) => acc + point.amount, 0) / data.length
  const periodLabel = period === 7 ? 'Semanal' : 'Mensal'
  const periodDays = period === 7 ? '7 dias' : '30 dias'

  return (
    <Card className="w-full rounded-2xl border-gray-100 shadow-sm">
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-gray-400">
              Receita {periodLabel.toLowerCase()}
            </p>
            {onPeriodChange && (
              <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-1">
                <button
                  onClick={() => onPeriodChange(7)}
                  className={cn(
                    'px-3 py-1 text-xs font-medium rounded-md transition-colors',
                    period === 7
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-600 hover:bg-gray-50'
                  )}
                >
                  7 dias
                </button>
                <button
                  onClick={() => onPeriodChange(30)}
                  className={cn(
                    'px-3 py-1 text-xs font-medium rounded-md transition-colors',
                    period === 30
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-600 hover:bg-gray-50'
                  )}
                >
                  30 dias
                </button>
              </div>
            )}
          </div>
          <CardTitle className="text-3xl font-light tracking-tight text-gray-900">
            {isLoading ? (
              <span className="inline-flex h-8 w-32 animate-pulse rounded bg-gray-200/80" />
            ) : (
              currencyFormatter.format(totalRevenue)
            )}
          </CardTitle>
          <p className="mt-1 text-sm text-gray-500">
            Últimos {periodDays} • {isLoading ? '—' : currencyFormatter.format(average)} média
          </p>
        </div>
      </CardHeader>
      <CardContent className="mt-2 pb-1 px-6 h-[240px]">
        {isLoading ? (
          <div className="h-full w-full animate-pulse rounded-xl bg-gray-100/80" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: -40 }}>
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(15,23,42,0.4)" stopOpacity={1} />
                  <stop offset="100%" stopColor="rgba(15,23,42,0)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12, fill: '#94a3b8' }}
              />
              <YAxis
                tickFormatter={(value) => currencyFormatter.format(Number(value))}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12, fill: '#94a3b8' }}
              />
              <Tooltip
                cursor={{ stroke: 'rgba(148,163,184,0.4)' }}
                formatter={(value: number) => currencyFormatter.format(value)}
                labelStyle={{ fontSize: 12, color: '#0f172a' }}
                contentStyle={{
                  borderRadius: '16px',
                  borderColor: '#e2e8f0',
                  boxShadow: '0 18px 30px rgba(15, 23, 42, 0.12)'
                }}
              />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="#0f172a"
                strokeWidth={2}
                fill="url(#chartGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}


