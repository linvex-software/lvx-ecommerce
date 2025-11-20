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

interface SalesPoint {
  date: string
  amount: number
}

interface SalesChartProps {
  data: SalesPoint[]
  isLoading?: boolean
}

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0
})

export function SalesChart({ data, isLoading = false }: SalesChartProps) {
  const latest = data[data.length - 1]?.amount ?? 0
  const average = data.reduce((acc, point) => acc + point.amount, 0) / data.length

  return (
    <Card className="h-full rounded-2xl border-gray-100 shadow-sm">
      <CardHeader className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-gray-400">
            Receita semanal
          </p>
          <CardTitle className="text-3xl font-light tracking-tight text-gray-900">
            {isLoading ? (
              <span className="inline-flex h-8 w-32 animate-pulse rounded bg-gray-200/80" />
            ) : (
              currencyFormatter.format(latest)
            )}
          </CardTitle>
        </div>
        <div className="text-right text-xs text-gray-500">
          Últimos 7 dias
          <p className="text-sm font-medium text-gray-900">
            {isLoading ? '—' : currencyFormatter.format(average)}
            <span className="ml-1 text-xs font-normal text-gray-500">média</span>
          </p>
        </div>
      </CardHeader>
      <CardContent className="mt-4 h-72">
        {isLoading ? (
          <div className="h-full w-full animate-pulse rounded-xl bg-gray-100/80" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
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


