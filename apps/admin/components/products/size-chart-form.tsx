'use client'

import { useMemo, useState } from 'react'
import { Plus, Trash2, Info } from 'lucide-react'
import { Button } from '@white-label/ui'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export interface SizeChartData {
  name: string
  chart_json: Record<string, Record<string, string>>
}

interface SizeChartFormProps {
  sizeChart: SizeChartData | null
  onChange: (sizeChart: SizeChartData | null) => void
}

type ChartMatrix = Record<string, Record<string, string>>

export function SizeChartForm({ sizeChart, onChange }: SizeChartFormProps) {
  const initialSizes = useMemo(() => {
    if (!sizeChart) return []
    return Object.keys(sizeChart.chart_json)
  }, [sizeChart])

  const initialMeasurements = useMemo(() => {
    if (!sizeChart) return []
    const measurementSet = new Set<string>()
    Object.values(sizeChart.chart_json).forEach((measurementMap) => {
      Object.keys(measurementMap || {}).forEach((measurement) => {
        measurementSet.add(measurement)
      })
    })
    return Array.from(measurementSet)
  }, [sizeChart])

  const [name, setName] = useState(sizeChart?.name || '')
  const [sizes, setSizes] = useState<string[]>(initialSizes)
  const [measurements, setMeasurements] = useState<string[]>(initialMeasurements)
  const [chartData, setChartData] = useState<ChartMatrix>(sizeChart?.chart_json || {})

  const hasBasicSetup = name.trim().length > 0
  const hasTable =
    hasBasicSetup && sizes.length > 0 && measurements.length > 0

  const upsertChartValue = (data: Record<string, Record<string, string>>) => {
    if (hasBasicSetup && Object.keys(data).length > 0) {
      onChange({ name, chart_json: data })
    } else {
      onChange(null)
    }
  }

  const handleNameChange = (value: string) => {
    setName(value)
    if (!value.trim()) {
      onChange(null)
      return
    }
    upsertChartValue(chartData)
  }

  const handleAddMeasurement = () => {
    const newMeasurement = `Medida ${measurements.length + 1}`
    const nextMeasurements = [...measurements, newMeasurement]
    const nextData: ChartMatrix = { ...chartData }

    sizes.forEach((size) => {
      if (!nextData[size]) nextData[size] = {}
      nextData[size][newMeasurement] = nextData[size][newMeasurement] || ''
    })

    setMeasurements(nextMeasurements)
    setChartData(nextData)
    upsertChartValue(nextData)
  }

  const handleAddSize = () => {
    const newSize = `Tamanho ${sizes.length + 1}`
    const nextSizes = [...sizes, newSize]
    const nextData: ChartMatrix = { ...chartData }
    nextData[newSize] = nextData[newSize] || {}

    measurements.forEach((measurement) => {
      nextData[newSize][measurement] = nextData[newSize][measurement] || ''
    })

    setSizes(nextSizes)
    setChartData(nextData)
    upsertChartValue(nextData)
  }

  const handleRemoveMeasurement = (measurement: string) => {
    if (!confirm(`Tem certeza que deseja remover a medida "${measurement}"?\n\nTodos os valores associados a esta medida serão perdidos.`)) {
      return
    }
    const nextMeasurements = measurements.filter((item) => item !== measurement)
    const nextData: ChartMatrix = { ...chartData }

    Object.keys(nextData).forEach((size) => {
      if (nextData[size]) {
        delete nextData[size][measurement]
      }
    })

    setMeasurements(nextMeasurements)
    setChartData(nextData)
    upsertChartValue(nextData)
  }

  const handleRemoveSize = (size: string) => {
    if (!confirm(`Tem certeza que deseja remover o tamanho "${size}"?\n\nTodos os valores associados a este tamanho serão perdidos.`)) {
      return
    }
    const nextSizes = sizes.filter((item) => item !== size)
    const nextData: ChartMatrix = { ...chartData }
    delete nextData[size]

    setSizes(nextSizes)
    setChartData(nextData)
    upsertChartValue(nextData)
  }

  const handleRenameSize = (previous: string, next: string) => {
    if (previous === next) return
    const nextSizes = sizes.map((item) => (item === previous ? next : item))
    const nextData: ChartMatrix = { ...chartData }

    if (nextData[previous]) {
      nextData[next] = nextData[previous]
      delete nextData[previous]
    } else {
      nextData[next] = {}
    }

    setSizes(nextSizes)
    setChartData(nextData)
    upsertChartValue(nextData)
  }

  const handleRenameMeasurement = (previous: string, next: string) => {
    const nextMeasurements = measurements.map((item) =>
      item === previous ? next : item
    )
    const nextData: ChartMatrix = { ...chartData }

    Object.keys(nextData).forEach((size) => {
      if (nextData[size] && nextData[size][previous] !== undefined) {
        nextData[size][next] = nextData[size][previous]
        delete nextData[size][previous]
      }
    })

    setMeasurements(nextMeasurements)
    setChartData(nextData)
    upsertChartValue(nextData)
  }

  const handleUpdateValue = (size: string, measurement: string, value: string) => {
    const nextData: ChartMatrix = { ...chartData }
    if (!nextData[size]) nextData[size] = {}
    nextData[size][measurement] = value

    setChartData(nextData)
    upsertChartValue(nextData)
  }

  const tableSummary = hasTable
    ? `${sizes.length} tamanhos · ${measurements.length} medidas`
    : 'Nenhum tamanho configurado'

  return (
    <Card className="rounded-2xl border-gray-100 shadow-sm">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-xl font-light">Tabela de Tamanhos</CardTitle>
            <CardDescription>
              Organize medidas para ajudar clientes e filtros internos
            </CardDescription>
          </div>
          <span className="rounded-full bg-gray-50 px-3 py-1 text-[0.7rem] font-medium text-gray-500">
            {tableSummary}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="size-chart-name">Nome da tabela *</Label>
          <Input
            id="size-chart-name"
            placeholder="Ex: Tabela de blusas femininas"
            value={name}
            onChange={(event) => handleNameChange(event.target.value)}
          />
          <p className="text-xs text-gray-500">
            Use nomes padronizados. Ex: “Tabela Jeans Slim” ou “Medidas Camiseta Unissex”.
          </p>
        </div>

        {hasBasicSetup ? (
          <>
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-800">Medidas</p>
                  <p className="text-xs text-gray-500">Defina colunas como busto, ombro, manga...</p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={handleAddMeasurement}>
                  <Plus className="h-4 w-4" />
                  Medida
                </Button>
              </div>

              {measurements.length === 0 && (
                <div className="rounded-xl border border-dashed border-gray-200 p-4 text-xs text-gray-500">
                  Adicione ao menos uma medida para começar a preencher a grade.
                </div>
              )}

              {measurements.length > 0 && (
                <div className="space-y-2">
                  {measurements.map((measurement, index) => (
                    <div key={`measurement-${index}`} className="flex items-center gap-2">
                      <Input
                        value={measurement}
                        onChange={(event) =>
                          handleRenameMeasurement(measurement, event.target.value)
                        }
                        placeholder="Ex: Busto (cm)"
                        className="text-sm"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="border-red-200 text-red-500"
                        onClick={() => handleRemoveMeasurement(measurement)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-800">Tamanhos</p>
                  <p className="text-xs text-gray-500">
                    Cadastre linhas (PP, P, M, G, GG...) que receberão os valores.
                  </p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={handleAddSize}>
                  <Plus className="h-4 w-4" />
                  Tamanho
                </Button>
              </div>

              {sizes.length === 0 && (
                <div className="rounded-xl border border-dashed border-gray-200 p-4 text-xs text-gray-500">
                  Adicione um tamanho para liberar a tabela de preenchimento.
                </div>
              )}

              {sizes.length > 0 && (
                <div className="space-y-2">
                  {sizes.map((size, index) => (
                    <div key={`size-${index}`} className="flex items-center gap-2">
                      <Input
                        value={size}
                        onChange={(event) => handleRenameSize(size, event.target.value)}
                        placeholder="Ex: M (38/40)"
                        className="text-sm"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="border-red-200 text-red-500"
                        onClick={() => handleRemoveSize(size)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {hasTable ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Info className="h-4 w-4" />
                  Preencha cada célula com valores padronizados (cm, pol, etc.).
                </div>
                <div className="overflow-x-auto rounded-2xl border border-gray-200">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                        <th className="border border-gray-200 px-3 py-2">Tamanho</th>
                        {measurements.map((measurement, measurementIndex) => (
                          <th
                            key={`measurement-header-${measurementIndex}`}
                            className="border border-gray-200 px-3 py-2"
                          >
                            {measurement || 'Medida'}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sizes.map((size, sizeIndex) => (
                        <tr key={`size-row-${sizeIndex}`}>
                          <td className="border border-gray-200 bg-gray-50 px-3 py-2 font-semibold text-gray-700">
                            {size || 'Tamanho'}
                          </td>
                          {measurements.map((measurement, measurementIndex) => (
                            <td
                              key={`cell-${sizeIndex}-${measurementIndex}`}
                              className="border border-gray-100 px-3 py-2"
                            >
                              <Input
                                value={chartData[size]?.[measurement] || ''}
                                onChange={(event) =>
                                  handleUpdateValue(size, measurement, event.target.value)
                                }
                                placeholder="Valor"
                                className="h-9 text-sm"
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}
          </>
        ) : (
          <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500">
            Dê um nome para a tabela para liberar as etapas de medidas e tamanhos.
          </div>
        )}
      </CardContent>
    </Card>
  )
}

