'use client'

import { useMemo, useState } from 'react'
import { SummaryCards, type SummaryCard } from '@/components/dashboard/summary-cards'
import { SalesChart } from '@/components/dashboard/sales-chart'
import { TopProducts, type TopProduct } from '@/components/dashboard/top-products'
import { OperationsCard } from '@/components/dashboard/operations-card'
import { useAuthStore } from '@/store/auth-store'
import { useTopProducts } from '@/lib/hooks/use-top-products'
import { useSalesByPeriod } from '@/lib/hooks/use-sales-by-period'
import { useRevenueMetrics } from '@/lib/hooks/use-revenue-metrics'
import { useOperationalMetrics } from '@/lib/hooks/use-operational-metrics'
import { ShoppingBag } from 'lucide-react'

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL'
})

export function DashboardContent() {
  const user = useAuthStore((state) => state.user)
  const [period, setPeriod] = useState<7 | 30 | 'custom'>(7)
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>()
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>()

  // Calcular datas do período
  const endDate = useMemo(() => {
    if (period === 'custom' && customEndDate) {
      return customEndDate
    }
    return new Date()
  }, [period, customEndDate])
  
  const startDate = useMemo(() => {
    if (period === 'custom' && customStartDate) {
      return customStartDate
    }
    const date = new Date()
    date.setDate(date.getDate() - (period === 7 ? 7 : 30))
    date.setHours(0, 0, 0, 0)
    return date
  }, [period, customStartDate])

  const handleCustomDatesChange = (start: Date, end: Date) => {
    setCustomStartDate(start)
    setCustomEndDate(end)
  }

  // Buscar dados reais da API
  const { data: salesData, isLoading: isLoadingSales } = useSalesByPeriod(startDate, endDate)
  const { data: revenueMetrics, isLoading: isLoadingRevenue } = useRevenueMetrics(startDate, endDate)
  const { data: operationalMetrics, isLoading: isLoadingMetrics } = useOperationalMetrics()
  const { data: topProductsData, isLoading: isLoadingTopProducts } = useTopProducts()

  // Converter dados de vendas para o formato do gráfico
  const chartData = useMemo(() => {
    if (!salesData) return []

    // Criar um mapa de vendas por data
    const salesMap = new Map<string, number>()
    salesData.forEach((sale) => {
      salesMap.set(sale.date, Math.round(Number(sale.revenue)))
    })

    // Preencher todos os dias do período (mesmo sem vendas)
    const allDays = []
    const currentDate = new Date(startDate)
    const finalDate = new Date(endDate)

    while (currentDate <= finalDate) {
      const dateStr = currentDate.toISOString().split('T')[0]
      
      let formattedDate: string
      if (period === 7) {
        formattedDate = currentDate.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')
      } else if (period === 30) {
        formattedDate = currentDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
      } else {
        // Período customizado: mostrar dia/mês
        formattedDate = currentDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
      }

      allDays.push({
        date: formattedDate,
        amount: salesMap.get(dateStr) || 0 // 0 se não houver vendas nesse dia
      })

      currentDate.setDate(currentDate.getDate() + 1)
    }

    return allDays
  }, [salesData, period, startDate, endDate])

  // Calcular receita total do período
  const totalRevenue = useMemo(() => {
    if (!salesData) return 0
    return salesData.reduce((sum, item) => sum + Number(item.revenue), 0) // revenue já vem em reais
  }, [salesData])

  // Cards de resumo
  const summaryCards = useMemo<SummaryCard[]>(() => {
    if (!revenueMetrics) return []

    return [
      {
        id: 'revenue',
        label: `Receita ${
          period === 7 ? 'dos últimos 7 dias' 
          : period === 30 ? 'dos últimos 30 dias'
          : 'do período selecionado'
        }`,
        value: currencyFormatter.format(Number(revenueMetrics.totalRevenue)), // revenue já vem em reais
        hint: `${revenueMetrics.ordersCount} pedidos realizados`,
        icon: ShoppingBag,
        change: { value: `${revenueMetrics.ordersCount} pedidos`, trend: 'up' as const }
      }
    ]
  }, [revenueMetrics, period])

  // Converter dados da API para o formato do componente
  const topProducts = useMemo<TopProduct[]>(() => {
    if (!topProductsData) return []

    return topProductsData.map((product) => ({
      id: product.id,
      name: product.name,
      sku: product.sku,
      category: product.category || 'Sem categoria',
      revenue: currencyFormatter.format(Number(product.revenue)), // revenue já vem em reais do banco
      unitsSold: product.unitsSold
    }))
  }, [topProductsData])

  const isLoading = isLoadingSales || isLoadingRevenue || isLoadingMetrics

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
            data={chartData} 
            isLoading={isLoadingSales}
            period={period}
            onPeriodChange={setPeriod}
            onCustomDatesChange={handleCustomDatesChange}
            customStartDate={customStartDate}
            customEndDate={customEndDate}
            totalRevenue={totalRevenue}
          />
          {/* Top produtos abaixo do gráfico */}
          <TopProducts products={topProducts} isLoading={isLoadingTopProducts} />
        </div>
        <div className="lg:col-span-1 flex flex-col gap-6">
          {/* Card de receita */}
          <SummaryCards cards={summaryCards} isLoading={isLoadingRevenue} />
          {/* Status operacional */}
          <OperationsCard
            pendingOrders={operationalMetrics?.pendingOrders ?? 0}
            awaitingShipment={operationalMetrics?.awaitingShipment ?? 0}
            lowStock={operationalMetrics?.lowStock ?? 0}
          />
        </div>
      </div>
    </div>
  )
}


