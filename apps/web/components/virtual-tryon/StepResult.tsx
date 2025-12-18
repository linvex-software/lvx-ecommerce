'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useTryOnStore } from './useTryOnStore'
import { recommendSize } from './algorithm'
import type { ParsedSizeChart, FitLevel } from './algorithm'
import { ArrowLeft, CheckCircle2, AlertCircle, XCircle, Sparkles, Info } from 'lucide-react'

interface StepResultProps {
  sizeChart: ParsedSizeChart
}

export default function StepResult({ sizeChart }: StepResultProps) {
  const { measurements, closeModal, setStep } = useTryOnStore()

  if (!measurements) {
    return null
  }

  const recommendation = recommendSize(measurements, sizeChart)

  if (!recommendation) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Não foi possível calcular</CardTitle>
          <CardDescription>
            Não encontramos medidas compatíveis na tabela deste produto.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => setStep('adjust')} variant="outline" className="w-full">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Revisar Medidas
          </Button>
        </CardContent>
      </Card>
    )
  }

  const getStatusIcon = (status: 'ok' | 'justo' | 'folgado') => {
    switch (status) {
      case 'ok':
        return <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
      case 'justo':
        return <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
      case 'folgado':
        return <XCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
    }
  }

  const getStatusText = (status: 'ok' | 'justo' | 'folgado') => {
    switch (status) {
      case 'ok':
        return 'Perfeito'
      case 'justo':
        return 'Um pouco justo'
      case 'folgado':
        return 'Um pouco folgado'
    }
  }

  const getStatusColor = (status: 'ok' | 'justo' | 'folgado') => {
    switch (status) {
      case 'ok':
        return 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
      case 'justo':
        return 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800'
      case 'folgado':
        return 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800'
    }
  }

  const getFitLevelInfo = (fitLevel: FitLevel) => {
    switch (fitLevel) {
      case 'excelente':
        return {
          label: 'Excelente Ajuste',
          description: 'Suas medidas estão muito próximas do tamanho ideal',
          color: 'text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800',
          icon: Sparkles
        }
      case 'bom':
        return {
          label: 'Bom Ajuste',
          description: 'O tamanho deve ficar bem, com pequenas diferenças',
          color: 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800',
          icon: CheckCircle2
        }
      case 'aproximado':
        return {
          label: 'Ajuste Aproximado',
          description: 'O tamanho pode funcionar, mas revise as medidas',
          color: 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800',
          icon: Info
        }
    }
  }

  const fitLevelInfo = getFitLevelInfo(recommendation.fitLevel)
  const FitIcon = fitLevelInfo.icon

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Card destacado com tamanho recomendado */}
      <Card className="border-2 border-foreground/20 bg-gradient-to-br from-background to-muted/30">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-foreground" />
                <CardTitle className="text-2xl">Tamanho {recommendation.size}</CardTitle>
              </div>
              <CardDescription className="text-base">
                Recomendado para você
              </CardDescription>
            </div>
            <div className={`px-4 py-2 rounded-lg border flex items-center gap-2 ${fitLevelInfo.color}`}>
              <FitIcon className="w-4 h-4" />
              <div className="text-left">
                <div className="text-xs font-medium uppercase tracking-wide">
                  {fitLevelInfo.label}
                </div>
                <div className="text-xs opacity-80 mt-0.5">
                  {fitLevelInfo.description}
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tabela Comparativa */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Comparação de Medidas</CardTitle>
          <CardDescription>
            Veja como suas medidas se comparam com o tamanho {recommendation.size}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {recommendation.comparison.length > 0 && (
            <div className="overflow-x-auto -mx-6 px-6">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-muted/50 text-left text-xs font-semibold uppercase text-muted-foreground">
                    <th className="border-b border-border px-4 py-3 text-left">Medida</th>
                    <th className="border-b border-border px-4 py-3 text-center">Você</th>
                    <th className="border-b border-border px-4 py-3 text-center">Produto ({recommendation.size})</th>
                    <th className="border-b border-border px-4 py-3 text-center">Ajuste</th>
                  </tr>
                </thead>
                <tbody>
                  {recommendation.comparison.map((item, index) => (
                    <tr
                      key={index}
                      className={`hover:bg-muted/30 transition-colors border-b border-border ${getStatusColor(item.status)}`}
                    >
                      <td className="px-4 py-3 font-semibold">
                        {item.measurement}
                      </td>
                      <td className="px-4 py-3 text-center font-medium">
                        {item.userValue}cm
                      </td>
                      <td className="px-4 py-3 text-center text-muted-foreground">
                        {item.productRange}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          {getStatusIcon(item.status)}
                          <span className="text-sm font-medium">{getStatusText(item.status)}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </CardContent>
      </Card>

      {/* Tamanho Alternativo */}
      {recommendation.alternativeSize && (
        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground mb-1">
                  Tamanho alternativo possível
                </p>
                <p className="text-sm text-muted-foreground">
                  Você está entre os tamanhos <strong>{recommendation.size}</strong> e{' '}
                  <strong>{recommendation.alternativeSize}</strong>. Recomendamos o{' '}
                  <strong>{recommendation.size}</strong> para um caimento mais justo.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ações */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <Button
          onClick={() => setStep('adjust')}
          variant="outline"
          className="flex-1 sm:flex-initial sm:min-w-[140px]"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Revisar Medidas
        </Button>
        <Button
          onClick={closeModal}
          className="flex-1 sm:flex-[2]"
          size="lg"
          variant="default"
        >
          Aplicar Recomendação
        </Button>
      </div>
    </div>
  )
}

