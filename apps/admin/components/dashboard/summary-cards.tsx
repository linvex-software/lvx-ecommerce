'use client'

import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export interface SummaryCard {
  id: string
  label: string
  value: string
  hint: string
  icon: LucideIcon
  change?: {
    value: string
    trend: 'up' | 'down'
  } | null
}

interface SummaryCardsProps {
  cards: SummaryCard[]
  isLoading?: boolean
}

export function SummaryCards({ cards, isLoading = false }: SummaryCardsProps) {
  return (
    <div className="flex flex-wrap gap-6">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <Card key={card.id} className="flex-1 min-w-[200px] dark:bg-surface-2 dark:border-[#1D1D1D]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-[0.3em] text-text-tertiary">
                {card.label}
              </CardTitle>
              <Icon className="h-5 w-5 text-text-tertiary dark:text-white/80" />
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-3xl font-semibold tracking-tight text-text-primary dark:text-white">
                {isLoading ? (
                  <span className="inline-flex h-8 w-24 animate-pulse rounded bg-gray-200/80 dark:bg-[#111111]" />
                ) : (
                  card.value
                )}
              </p>
              <div className="flex items-center justify-between text-sm text-text-secondary dark:text-[#B5B5B5]">
                <span>{card.hint}</span>
                {!isLoading && card.change ? (
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      card.change.trend === 'up'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                        : 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300'
                    }`}
                  >
                    {card.change.trend === 'up' ? (
                      <ArrowUpRight className="mr-1 h-3 w-3" />
                    ) : (
                      <ArrowDownRight className="mr-1 h-3 w-3" />
                    )}
                    {card.change.value}
                  </span>
                ) : null}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}


