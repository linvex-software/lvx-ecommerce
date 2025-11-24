'use client'

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
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

export function SizeChartForm({ sizeChart, onChange }: SizeChartFormProps) {
  const [name, setName] = useState(sizeChart?.name || '')
  const [sizes, setSizes] = useState<string[]>(
    sizeChart ? Object.keys(sizeChart.chart_json) : []
  )
  const [measurements, setMeasurements] = useState<string[]>(
    sizeChart && sizes.length > 0
      ? Object.keys(sizeChart.chart_json[sizes[0]] || {})
      : []
  )
  const [chartData, setChartData] = useState<Record<string, Record<string, string>>>(
    sizeChart?.chart_json || {}
  )

  const addSize = () => {
    const newSize = `Tamanho ${sizes.length + 1}`
    const newSizes = [...sizes, newSize]
    const newData = { ...chartData }
    newData[newSize] = {}
    measurements.forEach((measurement) => {
      newData[newSize][measurement] = ''
    })
    setSizes(newSizes)
    setChartData(newData)
    updateSizeChart(name, newData)
  }

  const removeSize = (size: string) => {
    const newSizes = sizes.filter((s) => s !== size)
    const newData = { ...chartData }
    delete newData[size]
    setSizes(newSizes)
    setChartData(newData)
    updateSizeChart(name, newData)
  }

  const addMeasurement = () => {
    const newMeasurement = `Medida ${measurements.length + 1}`
    const newMeasurements = [...measurements, newMeasurement]
    const newData = { ...chartData }
    sizes.forEach((size) => {
      if (!newData[size]) newData[size] = {}
      newData[size][newMeasurement] = ''
    })
    setMeasurements(newMeasurements)
    setChartData(newData)
    updateSizeChart(name, newData)
  }

  const removeMeasurement = (measurement: string) => {
    const newMeasurements = measurements.filter((m) => m !== measurement)
    const newData = { ...chartData }
    sizes.forEach((size) => {
      if (newData[size]) {
        delete newData[size][measurement]
      }
    })
    setMeasurements(newMeasurements)
    setChartData(newData)
    updateSizeChart(name, newData)
  }

  const updateSizeName = (oldSize: string, newSize: string) => {
    const newSizes = sizes.map((s) => (s === oldSize ? newSize : s))
    const newData = { ...chartData }
    if (newData[oldSize]) {
      newData[newSize] = newData[oldSize]
      delete newData[oldSize]
    }
    setSizes(newSizes)
    setChartData(newData)
    updateSizeChart(name, newData)
  }

  const updateMeasurementName = (oldMeasurement: string, newMeasurement: string) => {
    const newMeasurements = measurements.map((m) =>
      m === oldMeasurement ? newMeasurement : m
    )
    const newData = { ...chartData }
    sizes.forEach((size) => {
      if (newData[size] && newData[size][oldMeasurement] !== undefined) {
        newData[size][newMeasurement] = newData[size][oldMeasurement]
        delete newData[size][oldMeasurement]
      }
    })
    setMeasurements(newMeasurements)
    setChartData(newData)
    updateSizeChart(name, newData)
  }

  const updateCellValue = (size: string, measurement: string, value: string) => {
    const newData = { ...chartData }
    if (!newData[size]) newData[size] = {}
    newData[size][measurement] = value
    setChartData(newData)
    updateSizeChart(name, newData)
  }

  const updateSizeChart = (chartName: string, data: Record<string, Record<string, string>>) => {
    if (chartName.trim() && Object.keys(data).length > 0) {
      onChange({ name: chartName, chart_json: data })
    } else {
      onChange(null)
    }
  }

  const handleNameChange = (value: string) => {
    setName(value)
    updateSizeChart(value, chartData)
  }

  return (
    <Card className="rounded-2xl border-gray-100 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-light">Tabela de Tamanhos</CardTitle>
            <CardDescription>Configure a tabela de medidas do produto</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="size-chart-name">Nome da Tabela *</Label>
          <Input
            id="size-chart-name"
            placeholder="Ex: Tabela de Tamanhos - Blusas"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
          />
        </div>

        {name && (
          <>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={addSize} className="gap-2">
                <Plus className="h-4 w-4" />
                Adicionar Tamanho
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addMeasurement}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Adicionar Medida
              </Button>
            </div>

            {sizes.length > 0 && measurements.length > 0 && (
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-200 px-3 py-2 text-left text-xs font-semibold uppercase text-gray-600">
                        Tamanho / Medida
                      </th>
                      {measurements.map((measurement, idx) => (
                        <th key={idx} className="border border-gray-200 px-3 py-2">
                          <div className="flex items-center gap-2">
                            <Input
                              value={measurement}
                              onChange={(e) =>
                                updateMeasurementName(measurement, e.target.value)
                              }
                              className="h-7 text-xs"
                              placeholder="Medida"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeMeasurement(measurement)}
                              className="h-7 w-7 p-0 text-red-600"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sizes.map((size, sizeIdx) => (
                      <tr key={sizeIdx}>
                        <td className="border border-gray-200 bg-gray-50 px-3 py-2">
                          <div className="flex items-center gap-2">
                            <Input
                              value={size}
                              onChange={(e) => updateSizeName(size, e.target.value)}
                              className="h-7 text-xs font-medium"
                              placeholder="Tamanho"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeSize(size)}
                              className="h-7 w-7 p-0 text-red-600"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                        {measurements.map((measurement, measIdx) => (
                          <td key={measIdx} className="border border-gray-200 px-3 py-2">
                            <Input
                              value={chartData[size]?.[measurement] || ''}
                              onChange={(e) =>
                                updateCellValue(size, measurement, e.target.value)
                              }
                              className="h-7 text-xs"
                              placeholder="Valor"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

