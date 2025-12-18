'use client'

import { Card } from '@/components/ui/card'

interface SizeChartProps {
  sizeChart: {
    name: string
    chart_json: Record<string, unknown>
  } | null
}

export default function SizeChart({ sizeChart }: SizeChartProps) {
  if (!sizeChart || !sizeChart.chart_json) {
    return null
  }

  const chartData = sizeChart.chart_json

  // Validar estrutura: deve ser um objeto, não array
  if (!chartData || typeof chartData !== 'object' || Array.isArray(chartData)) {
    return null
  }

  // Validar que todos os valores são objetos (não arrays, não primitivos)
  const isValidStructure = Object.values(chartData).every(
    (value) => value && typeof value === 'object' && !Array.isArray(value)
  )

  if (!isValidStructure) {
    return null
  }

  // Agora podemos fazer o cast com segurança
  const typedChartData = chartData as Record<string, Record<string, string>>

  // Extrair tamanhos (chaves do objeto)
  const sizes = Object.keys(typedChartData)

  if (sizes.length === 0) {
    return null
  }

  // Extrair medidas únicas (chaves dos objetos internos)
  const measurementsSet = new Set<string>()
  Object.values(typedChartData).forEach((measurementMap) => {
    if (measurementMap && typeof measurementMap === 'object') {
      Object.keys(measurementMap).forEach((measurement) => {
        measurementsSet.add(measurement)
      })
    }
  })

  const measurements = Array.from(measurementsSet)

  if (measurements.length === 0) {
    return null
  }

  return (
    <Card className="border border-border">
      <div className="p-6 space-y-4">
        <h3 className="text-xl font-bold">{sizeChart.name}</h3>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-muted text-left text-xs font-semibold uppercase text-muted-foreground">
                <th className="border border-border px-4 py-3">Tamanho</th>
                {measurements.map((measurement) => (
                  <th
                    key={measurement}
                    className="border border-border px-4 py-3"
                  >
                    {measurement}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sizes.map((size) => (
                <tr key={size} className="hover:bg-muted/50 transition-colors">
                  <td className="border border-border bg-muted px-4 py-3 font-semibold">
                    {size}
                  </td>
                  {measurements.map((measurement) => (
                    <td
                      key={`${size}-${measurement}`}
                      className="border border-border px-4 py-3 text-center"
                    >
                      {typedChartData[size]?.[measurement] || '-'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  )
}

