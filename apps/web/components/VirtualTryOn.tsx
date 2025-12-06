'use client'

import { Button } from '@/components/ui/button'
import { TryOnModal, useTryOnStore } from './virtual-tryon'
import type { ParsedSizeChart } from './virtual-tryon/algorithm'

interface VirtualTryOnProps {
  virtualModelUrl: string | null
  virtualProvider: string | null
  virtualConfigJson: Record<string, unknown> | null
  productName: string
  sizeChart: {
    name: string
    chart_json: Record<string, unknown>
  } | null
}

export default function VirtualTryOn({
  virtualModelUrl,
  virtualProvider,
  virtualConfigJson,
  productName,
  sizeChart
}: VirtualTryOnProps) {
  const { openModal } = useTryOnStore()

  // Validar se o size_chart é válido para o provador virtual
  const hasValidSizeChart = (() => {
    if (!sizeChart || !sizeChart.chart_json) {
      return false
    }

    const chartData = sizeChart.chart_json

    // Validar estrutura: deve ser um objeto, não array
    if (!chartData || typeof chartData !== 'object' || Array.isArray(chartData)) {
      return false
    }

    // Validar que todos os valores são objetos (não arrays, não primitivos)
    const isValidStructure = Object.values(chartData).every(
      (value) => value && typeof value === 'object' && !Array.isArray(value)
    )

    return isValidStructure && Object.keys(chartData).length > 0
  })()

  // Se não tiver size_chart válido, não renderizar o botão
  // (ou renderizar mensagem amigável - escolhemos não renderizar para manter UI limpa)
  if (!hasValidSizeChart) {
    return null
  }

  // Converter chart_json para formato esperado pelo algoritmo
  const parsedSizeChart: ParsedSizeChart = sizeChart.chart_json as ParsedSizeChart

  return (
    <>
      <Button
        onClick={openModal}
        variant="outline"
        className="w-full border-2 transition-all hover:scale-[1.02] active:scale-[0.98] hover:border-foreground/50"
      >
        Descobrir meu tamanho
      </Button>

      <TryOnModal
        sizeChart={parsedSizeChart}
        productName={productName}
      />
    </>
  )
}

