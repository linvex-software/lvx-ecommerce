'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useTryOnStore } from './useTryOnStore'
import type { UserMeasurements } from './algorithm'
import { ArrowLeft } from 'lucide-react'

export default function StepAdjust() {
  const { measurements, setMeasurements, setStep } = useTryOnStore()

  const [formData, setFormData] = useState<UserMeasurements>({
    bust: measurements?.bust || 0,
    waist: measurements?.waist || 0,
    hips: measurements?.hips || 0
  })

  // Carregar medidas ao montar
  useEffect(() => {
    if (measurements) {
      setFormData(measurements)
    }
  }, [measurements])

  const handleContinue = () => {
    setMeasurements(formData)
    setStep('result')
  }

  const handleBack = () => {
    setStep('user-data')
  }

  const isFormValid = formData.bust > 0 && formData.waist > 0 && formData.hips > 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ajuste das Medidas</CardTitle>
        <CardDescription>
          Revise e ajuste as medidas estimadas conforme necessário. Use valores em centímetros. Você pode medir com uma fita métrica para maior precisão.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Busto */}
        <div className="space-y-2">
          <label htmlFor="bust" className="text-sm font-medium">
            Busto (cm)
          </label>
          <Input
            id="bust"
            type="number"
            min="60"
            max="150"
            value={formData.bust || ''}
            onChange={(e) => setFormData({ ...formData, bust: parseInt(e.target.value) || 0 })}
            placeholder="Digite a medida do busto em cm"
            className="transition-all focus:scale-[1.01]"
          />
          <p className="text-xs text-muted-foreground">
            Medida ao redor do tórax na altura dos seios (maior parte do peito)
          </p>
        </div>

        {/* Cintura */}
        <div className="space-y-2">
          <label htmlFor="waist" className="text-sm font-medium">
            Cintura (cm)
          </label>
          <Input
            id="waist"
            type="number"
            min="50"
            max="150"
            value={formData.waist || ''}
            onChange={(e) => setFormData({ ...formData, waist: parseInt(e.target.value) || 0 })}
            placeholder="Digite a medida da cintura em cm"
            className="transition-all focus:scale-[1.01]"
          />
          <p className="text-xs text-muted-foreground">
            Medida na parte mais estreita do tronco (geralmente acima do umbigo)
          </p>
        </div>

        {/* Quadril */}
        <div className="space-y-2">
          <label htmlFor="hips" className="text-sm font-medium">
            Quadril (cm)
          </label>
          <Input
            id="hips"
            type="number"
            min="60"
            max="150"
            value={formData.hips || ''}
            onChange={(e) => setFormData({ ...formData, hips: parseInt(e.target.value) || 0 })}
            placeholder="Digite a medida do quadril em cm"
            className="transition-all focus:scale-[1.01]"
          />
          <p className="text-xs text-muted-foreground">
            Medida na parte mais larga do quadril (geralmente na altura dos ossos do quadril)
          </p>
        </div>

        {/* Botões */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            onClick={handleBack}
            variant="outline"
            className="flex-1 sm:flex-initial sm:min-w-[120px] transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <Button
            onClick={handleContinue}
            disabled={!isFormValid}
            className="flex-1 sm:flex-[2] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            size="lg"
          >
            Ver Recomendação
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

