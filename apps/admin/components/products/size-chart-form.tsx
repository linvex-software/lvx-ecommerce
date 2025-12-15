'use client'

import { useMemo, useState, useRef, useEffect } from 'react'
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@white-label/ui'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

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
  const [showHelper, setShowHelper] = useState(false)
  
  // Accordion state para mobile
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    measures: true,
    sizes: true,
    table: true
  })

  // Scroll indicators state
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  // Verificar scroll disponível
  const checkScroll = () => {
    if (!scrollContainerRef.current) return
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
    setCanScrollLeft(scrollLeft > 0)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1)
  }

  useEffect(() => {
    if (!scrollContainerRef.current) return
    checkScroll()
    const container = scrollContainerRef.current
    container.addEventListener('scroll', checkScroll)
    window.addEventListener('resize', checkScroll)
    return () => {
      container.removeEventListener('scroll', checkScroll)
      window.removeEventListener('resize', checkScroll)
    }
  }, [measurements.length, sizes.length, expandedSections.table])

  const hasBasicSetup = name.trim().length > 0
  const hasTable = hasBasicSetup && sizes.length > 0 && measurements.length > 0

  const tableSummary = hasTable
    ? `${sizes.length} tamanhos · ${measurements.length} medidas`
    : 'Nenhum tamanho configurado'

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

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

  return (
    <div className="space-y-6">
      {/* Header claro */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-text-primary dark:text-white">
            Tabela de Tamanhos
          </h3>
          {hasTable && (
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary dark:bg-primary/20 dark:text-primary">
              {tableSummary}
            </span>
          )}
        </div>
        {hasTable && (
          <span className="inline-flex items-center gap-1.5 rounded-md bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 dark:bg-green-900/20 dark:text-green-400">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
            Provador Virtual habilitado automaticamente
          </span>
        )}
      </div>

      {/* Helper text colapsável */}
      {!showHelper && (
        <button
          type="button"
          onClick={() => setShowHelper(true)}
          className="text-xs text-text-tertiary hover:text-text-secondary dark:text-text-tertiary dark:hover:text-text-secondary"
        >
          Saiba mais sobre tabelas de medidas
        </button>
      )}
      {showHelper && (
        <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-text-secondary dark:border-border dark:bg-muted/20">
          <p className="mb-2">
            Organize medidas para ajudar clientes a escolherem o tamanho correto.
            Use nomes padronizados como "Busto (cm)", "Cintura (cm)", "Quadril (cm)".
          </p>
          <button
            type="button"
            onClick={() => setShowHelper(false)}
            className="font-medium text-primary hover:underline dark:text-primary"
          >
            Ocultar
          </button>
        </div>
      )}

      {/* Nome da tabela */}
      <div className="space-y-2">
        <Label htmlFor="size-chart-name" className="text-sm font-medium">
          Nome da tabela *
        </Label>
        <Input
          id="size-chart-name"
          placeholder="Ex: Tabela de blusas femininas"
          value={name}
          onChange={(event) => handleNameChange(event.target.value)}
          className="dark:bg-surface dark:border-border"
        />
      </div>

      {hasBasicSetup ? (
        <div className="space-y-6">
          {/* Seção: Medidas - Accordion no mobile */}
          <div className="rounded-lg border border-border bg-surface dark:border-border dark:bg-surface-2">
            <button
              type="button"
              onClick={() => toggleSection('measures')}
              className="flex w-full items-center justify-between p-4 text-left lg:cursor-default lg:pointer-events-none"
            >
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-text-primary dark:text-white">
                  Medidas
                </h4>
                <p className="mt-0.5 text-xs text-text-secondary dark:text-text-tertiary">
                  Defina colunas como busto, ombro, manga...
                </p>
              </div>
              <div className="ml-4 lg:hidden">
                {expandedSections.measures ? (
                  <ChevronUp className="h-4 w-4 text-text-tertiary" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-text-tertiary" />
                )}
              </div>
            </button>

            <div className={`px-3 pb-3 lg:px-4 lg:pb-4 ${expandedSections.measures ? 'block' : 'hidden lg:block'}`}>
              <div className="mb-3 flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddMeasurement}
                  className="dark:border-border dark:bg-surface dark:hover:bg-surface-2"
                >
                  <Plus className="h-4 w-4 mr-1.5" />
                  Adicionar Medida
                </Button>
              </div>

              {measurements.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-text-tertiary dark:border-border dark:text-text-tertiary">
                  Adicione ao menos uma medida para começar a preencher a grade.
                </div>
              ) : (
                <div className="space-y-2">
                  {measurements.map((measurement, index) => (
                    <div key={`measurement-${index}`} className="flex items-center gap-2">
                      <Input
                        value={measurement}
                        onChange={(event) =>
                          handleRenameMeasurement(measurement, event.target.value)
                        }
                        placeholder="Ex: Busto (cm)"
                        className="flex-1 text-sm dark:bg-surface dark:border-border"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-9 w-9 border-red-200 p-0 text-red-500 hover:bg-red-50 hover:text-red-600 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                        onClick={() => handleRemoveMeasurement(measurement)}
                        title="Remover medida"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Seção: Tamanhos - Accordion no mobile */}
          <div className="rounded-lg border border-border bg-surface dark:border-border dark:bg-surface-2">
            <button
              type="button"
              onClick={() => toggleSection('sizes')}
              className="flex w-full items-center justify-between p-4 text-left lg:cursor-default lg:pointer-events-none"
            >
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-text-primary dark:text-white">
                  Tamanhos
                </h4>
                <p className="mt-0.5 text-xs text-text-secondary dark:text-text-tertiary">
                  Cadastre linhas (PP, P, M, G, GG...) que receberão os valores.
                </p>
              </div>
              <div className="ml-4 lg:hidden">
                {expandedSections.sizes ? (
                  <ChevronUp className="h-4 w-4 text-text-tertiary" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-text-tertiary" />
                )}
              </div>
            </button>

            <div className={`px-3 pb-3 lg:px-4 lg:pb-4 ${expandedSections.sizes ? 'block' : 'hidden lg:block'}`}>
              <div className="mb-3 flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddSize}
                  className="dark:border-border dark:bg-surface dark:hover:bg-surface-2"
                >
                  <Plus className="h-4 w-4 mr-1.5" />
                  Adicionar Tamanho
                </Button>
              </div>

              {sizes.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-text-tertiary dark:border-border dark:text-text-tertiary">
                  Adicione um tamanho para liberar a tabela de preenchimento.
                </div>
              ) : (
                <div className="space-y-2">
                  {sizes.map((size, index) => (
                    <div key={`size-${index}`} className="flex items-center gap-2">
                      <Input
                        value={size}
                        onChange={(event) => handleRenameSize(size, event.target.value)}
                        placeholder="Ex: M (38/40)"
                        className="flex-1 text-sm dark:bg-surface dark:border-border"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-9 w-9 border-red-200 p-0 text-red-500 hover:bg-red-50 hover:text-red-600 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                        onClick={() => handleRemoveSize(size)}
                        title="Remover tamanho"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Tabela - Accordion no mobile */}
          {hasTable && (
            <div className="rounded-lg border border-border bg-surface dark:border-border dark:bg-surface-2">
              <button
                type="button"
                onClick={() => toggleSection('table')}
                className="flex w-full items-center justify-between p-4 text-left lg:cursor-default lg:pointer-events-none"
              >
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-text-primary dark:text-white">
                    Tabela de Preenchimento
                  </h4>
                  <p className="mt-0.5 text-xs text-text-secondary dark:text-text-tertiary">
                    Preencha cada célula com valores padronizados (cm, pol, etc.).
                  </p>
                </div>
                <div className="ml-4 lg:hidden">
                  {expandedSections.table ? (
                    <ChevronUp className="h-4 w-4 text-text-tertiary" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-text-tertiary" />
                  )}
                </div>
              </button>

              <div className={`px-3 pb-3 lg:px-4 lg:pb-4 ${expandedSections.table ? 'block' : 'hidden lg:block'}`}>
                {/* Texto de ajuda no mobile */}
                <p className="mb-2 text-xs text-text-tertiary lg:hidden">
                  Deslize horizontalmente para ver todas as medidas →
                </p>
                {/* Container com scroll e indicadores */}
                <div className="relative">
                  {/* Fade esquerdo */}
                  {canScrollLeft && (
                    <div className="pointer-events-none absolute left-0 top-0 z-20 h-full w-8 bg-gradient-to-r from-surface to-transparent lg:hidden dark:from-surface-2" />
                  )}
                  {/* Fade direito */}
                  {canScrollRight && (
                    <div className="pointer-events-none absolute right-0 top-0 z-20 h-full w-8 bg-gradient-to-l from-surface to-transparent lg:hidden dark:from-surface-2" />
                  )}
                  {/* Container de scroll */}
                  <div
                    ref={scrollContainerRef}
                    className="w-full overflow-x-auto overflow-y-visible rounded-lg border border-border dark:border-border [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-muted/30 [&::-webkit-scrollbar-thumb]:bg-muted/60 [&::-webkit-scrollbar-thumb]:rounded [scrollbar-width:thin] [scrollbar-color:rgb(var(--muted)/0.6)_rgb(var(--muted)/0.3)]"
                    style={{ 
                      scrollBehavior: 'smooth',
                      WebkitOverflowScrolling: 'touch' // Smooth scroll no iOS
                    }}
                  >
                    <table className="w-full border-collapse text-sm" style={{ minWidth: `${Math.max(600, 100 + (measurements.length * 140))}px` }}>
                      <thead>
                        <tr className="bg-muted/50 dark:bg-muted/30">
                          <th className="min-w-[100px] lg:sticky lg:left-0 lg:z-10 border-r border-border bg-muted/50 px-3 py-2 lg:px-4 lg:py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-secondary dark:border-border dark:bg-muted/50 dark:text-text-tertiary">
                            Tamanho
                          </th>
                          {measurements.map((measurement, measurementIndex) => (
                            <th
                              key={`measurement-header-${measurementIndex}`}
                              className="min-w-[120px] lg:min-w-[140px] border-b border-r border-border px-3 py-2 lg:px-4 lg:py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-secondary last:border-r-0 dark:border-border dark:text-text-tertiary"
                            >
                              {measurement || 'Medida'}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {sizes.map((size, sizeIndex) => (
                          <tr
                            key={`size-row-${sizeIndex}`}
                            className="border-b border-border last:border-b-0 dark:border-border"
                          >
                            <td className="min-w-[100px] lg:sticky lg:left-0 lg:z-10 border-r border-border bg-muted/30 px-3 py-2 lg:px-4 lg:py-3 font-semibold text-text-primary dark:border-border dark:bg-muted/40 dark:text-white">
                              {size || 'Tamanho'}
                            </td>
                            {measurements.map((measurement, measurementIndex) => (
                              <td
                                key={`cell-${sizeIndex}-${measurementIndex}`}
                                className="border-r border-border px-3 py-2 lg:px-4 lg:py-3 last:border-r-0 dark:border-border"
                              >
                                <Input
                                  value={chartData[size]?.[measurement] || ''}
                                  onChange={(event) =>
                                    handleUpdateValue(size, measurement, event.target.value)
                                  }
                                  placeholder="Ex: 80-84"
                                  className="h-9 w-full min-w-[96px] text-sm dark:bg-surface dark:border-border"
                                />
                              </td>
                            ))}
                          </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-text-tertiary dark:border-border dark:text-text-tertiary">
          Dê um nome para a tabela para liberar as etapas de medidas e tamanhos.
        </div>
      )}
    </div>
  )
}
