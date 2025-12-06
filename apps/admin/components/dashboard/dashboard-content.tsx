'use client'

import { useEffect, useMemo, useState } from 'react'
import { SummaryCards, type SummaryCard } from '@/components/dashboard/summary-cards'
import { SalesChart } from '@/components/dashboard/sales-chart'
import { TopProducts, type TopProduct } from '@/components/dashboard/top-products'
import { OperationsCard } from '@/components/dashboard/operations-card'
import { useAuthStore } from '@/store/auth-store'
import { useTopProducts } from '@/lib/hooks/use-top-products'
import { ShoppingBag } from 'lucide-react'

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL'
})

function generateSeed(storeId: string | null): number {
  if (!storeId) return 42
  return storeId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
}

export function DashboardContent() {
  const user = useAuthStore((state) => state.user)
  const storeId = user?.storeId ?? null
  const [isLoading, setIsLoading] = useState(true)

  const seed = useMemo(() => generateSeed(storeId), [storeId])

  useEffect(() => {
    setIsLoading(true)
    const timeout = setTimeout(() => {
      setIsLoading(false)
    }, 600)

    return () => clearTimeout(timeout)
  }, [seed])

  const baseValue = useMemo(() => 6000 + seed * 3, [seed])

  const summaryCards = useMemo<SummaryCard[]>(() => {
    const base = baseValue
    return [
      {
        id: 'today',
        label: 'Vendas do dia',
        value: currencyFormatter.format(base * 0.28),
        hint: 'Comparado ao mesmo dia anterior',
        icon: ShoppingBag,
        change: { value: '+12%', trend: 'up' }
      }
    ]
  }, [baseValue, seed])

  const [period, setPeriod] = useState<7 | 30>(7)

  const salesData = useMemo(() => {
    const today = new Date()
    const days = period === 7 ? 7 : 30
    const isWeekly = period === 7

    return Array.from({ length: days }).map((_, index) => {
      const date = new Date(today)
      date.setDate(today.getDate() - (days - 1 - index))
      
      let amount = 2000 + Math.sin(index * 0.9 + seed) * 500 + ((seed % days) + 1) * 90
      
      if (isWeekly) {
        amount += index * 120
      } else {
        // Para 30 dias, variação mais suave
        amount += index * 40
      }

      const formattedDate = isWeekly
        ? date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')
        : date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })

      return {
        date: formattedDate,
        amount: Math.max(700, Math.round(amount))
      }
    })
  }, [seed, period])

  // Calcular receita total do período
  const totalRevenue = useMemo(() => {
    return salesData.reduce((sum, item) => sum + item.amount, 0)
  }, [salesData])

  // Buscar top produtos da API
  const { data: topProductsData, isLoading: isLoadingTopProducts } = useTopProducts()

  // Converter dados da API para o formato do componente
  const topProducts = useMemo<TopProduct[]>(() => {
    if (!topProductsData) return []

    return topProductsData.map((product) => ({
      id: product.id,
      name: product.name,
      sku: product.sku,
      category: product.category || 'Sem categoria',
      revenue: currencyFormatter.format(Number(product.revenue) / 100), // Converter de centavos para reais
      unitsSold: product.unitsSold
    }))
  }, [topProductsData])

  return (
    <div className="w-full space-y-8">
      {/* Header da página */}
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-gray-400">
          {user?.storeId ? `Loja ${user.storeId.slice(0, 8)}...` : 'Loja'}
        </p>
        <h1 className="mt-2 text-4xl font-light tracking-tight text-gray-900">Visão geral</h1>
        <p className="mt-2 text-sm font-light text-gray-500">
          Bem-vindo ao painel administrativo
        </p>
      </div>

      {/* Primeira linha: Gráfico + Status operacional */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <SalesChart 
            data={salesData} 
            isLoading={isLoading}
            period={period}
            onPeriodChange={setPeriod}
            totalRevenue={totalRevenue}
          />
          {/* Top produtos abaixo do gráfico */}
          <TopProducts products={topProducts} isLoading={isLoadingTopProducts} />
        </div>
        <div className="lg:col-span-1 flex flex-col gap-6">
          {/* Card de vendas do dia */}
          <SummaryCards cards={summaryCards} isLoading={isLoading} />
          {/* Status operacional */}
          <OperationsCard
            pendingOrders={Math.round((seed % 17) + 4)}
            awaitingShipment={Math.round((seed % 11) + 2)}
            lowStock={Math.max(0, Math.round((seed % 9) - 2))}
          />
        </div>
      </div>
    </div>
  )
}


