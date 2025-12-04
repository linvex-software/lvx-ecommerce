'use client'

import { useEffect, useMemo, useState } from 'react'
import { SummaryCards, type SummaryCard } from '@/components/dashboard/summary-cards'
import { SalesChart } from '@/components/dashboard/sales-chart'
import { TopProducts, type TopProduct } from '@/components/dashboard/top-products'
import { OperationsCard } from '@/components/dashboard/operations-card'
import { useAuthStore } from '@/store/auth-store'
import { ShoppingBag, CreditCard, Package, AlertTriangle } from 'lucide-react'

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

  const monthlyRevenueValue = useMemo(() => baseValue * 2.4, [baseValue])

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
      },
      {
        id: 'month',
        label: 'Vendas do mês',
        value: currencyFormatter.format(monthlyRevenueValue),
        hint: 'Média diária x dias úteis',
        icon: CreditCard,
        change: { value: '+8%', trend: 'up' }
      },
      {
        id: 'orders',
        label: 'Pedidos pendentes',
        value: `${Math.round((seed % 17) + 4)}`,
        hint: 'Pagos aguardando expedição',
        icon: Package,
        change: { value: '-5%', trend: 'down' }
      },
      {
        id: 'stock',
        label: 'Estoque baixo',
        value: `${Math.max(0, Math.round((seed % 9) - 2))}`,
        hint: 'Produtos abaixo do mínimo',
        icon: AlertTriangle,
        change: null
      }
    ]
  }, [baseValue, monthlyRevenueValue, seed])

  const salesData = useMemo(() => {
    const today = new Date()
    return Array.from({ length: 7 }).map((_, index) => {
      const date = new Date(today)
      date.setDate(today.getDate() - (6 - index))
      const amount =
        2000 +
        Math.sin(index * 0.9 + seed) * 500 +
        ((seed % 7) + 1) * 90 +
        index * 120

      return {
        date: date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''),
        amount: Math.max(700, Math.round(amount))
      }
    })
  }, [seed])

  const topProducts = useMemo<TopProduct[]>(() => {
    const baseProducts = [
      { name: 'Blazer Essential', category: 'Alfaiataria' },
      { name: 'Vestido Aurora', category: 'Coleção assinatura' },
      { name: 'Bolsa Luna', category: 'Acessórios' },
      { name: 'Sandália Riviera', category: 'Calçados' }
    ]

    return baseProducts.map((product, index) => {
      const revenue = currencyFormatter.format(8500 + seed * (index + 1) * 6)
      const unitsSold = 40 + ((seed + index * 3) % 35)
      return {
        id: `${product.name}-${index}`,
        name: product.name,
        category: product.category,
        revenue,
        unitsSold
      }
    })
  }, [seed])

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

      {/* Primeira linha: 4 cards de KPI */}
      <SummaryCards cards={summaryCards} isLoading={isLoading} />

      {/* Segunda linha: Gráfico + Status operacional */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SalesChart data={salesData} isLoading={isLoading} />
        </div>
        <div className="lg:col-span-1">
          <OperationsCard
            pendingOrders={Math.round((seed % 17) + 4)}
            awaitingShipment={Math.round((seed % 11) + 2)}
            lowStock={Math.max(0, Math.round((seed % 9) - 2))}
          />
        </div>
      </div>

      {/* Terceira linha: Top produtos */}
      <TopProducts products={topProducts} isLoading={isLoading} />
    </div>
  )
}


