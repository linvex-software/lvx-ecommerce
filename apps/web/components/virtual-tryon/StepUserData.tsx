'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useTryOnStore } from './useTryOnStore'
import { estimateMeasurements } from './algorithm'
import type { UserBasicData } from './algorithm'

export default function StepUserData() {
  const { userData, setUserData, setMeasurements, setStep } = useTryOnStore()

  const [formData, setFormData] = useState<UserBasicData>({
    gender: userData?.gender || 'feminino',
    height: userData?.height || 0,
    weight: userData?.weight || 0,
    age: userData?.age || 0
  })

  const [errors, setErrors] = useState<Partial<Record<keyof UserBasicData, string>>>({})

  // Carregar dados salvos ao montar
  useEffect(() => {
    if (userData) {
      setFormData(userData)
    }
  }, [userData])

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof UserBasicData, string>> = {}

    if (formData.height < 100 || formData.height > 250) {
      newErrors.height = 'Altura deve estar entre 100 e 250 cm'
    }

    if (formData.weight < 30 || formData.weight > 200) {
      newErrors.weight = 'Peso deve estar entre 30 e 200 kg'
    }

    if (formData.age < 10 || formData.age > 120) {
      newErrors.age = 'Idade deve estar entre 10 e 120 anos'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleContinue = () => {
    if (!validate()) {
      return
    }

    // Salvar dados do usuário
    setUserData(formData)

    // Estimar medidas iniciais
    const estimated = estimateMeasurements(formData)
    setMeasurements(estimated)

    // Avançar para próxima etapa
    setStep('adjust')
  }

  const isFormValid = formData.height > 0 && formData.weight > 0 && formData.age > 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dados Básicos</CardTitle>
        <CardDescription>
          Preencha suas informações para começarmos a calcular seu tamanho ideal. Seus dados serão salvos para facilitar próximas compras.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Sexo */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Sexo</label>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, gender: 'feminino' })}
              className={`flex-1 px-4 py-3 rounded-md border-2 transition-colors ${
                formData.gender === 'feminino'
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-border hover:border-foreground/50'
              }`}
            >
              Feminino
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, gender: 'masculino' })}
              className={`flex-1 px-4 py-3 rounded-md border-2 transition-colors ${
                formData.gender === 'masculino'
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-border hover:border-foreground/50'
              }`}
            >
              Masculino
            </button>
          </div>
        </div>

        {/* Altura */}
        <div className="space-y-2">
          <label htmlFor="height" className="text-sm font-medium">
            Altura (cm)
          </label>
          <Input
            id="height"
            type="number"
            min="100"
            max="250"
            value={formData.height || ''}
            onChange={(e) => setFormData({ ...formData, height: parseInt(e.target.value) || 0 })}
            placeholder="Digite sua altura em centímetros"
            className={errors.height ? 'border-destructive focus-visible:ring-destructive' : ''}
          />
          {errors.height ? (
            <p className="text-sm text-destructive flex items-center gap-1">
              <span>⚠</span> {errors.height}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Exemplo: 165 cm
            </p>
          )}
        </div>

        {/* Peso */}
        <div className="space-y-2">
          <label htmlFor="weight" className="text-sm font-medium">
            Peso (kg)
          </label>
          <Input
            id="weight"
            type="number"
            min="30"
            max="200"
            value={formData.weight || ''}
            onChange={(e) => setFormData({ ...formData, weight: parseInt(e.target.value) || 0 })}
            placeholder="Digite seu peso em quilogramas"
            className={errors.weight ? 'border-destructive focus-visible:ring-destructive' : ''}
          />
          {errors.weight ? (
            <p className="text-sm text-destructive flex items-center gap-1">
              <span>⚠</span> {errors.weight}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Exemplo: 65 kg
            </p>
          )}
        </div>

        {/* Idade */}
        <div className="space-y-2">
          <label htmlFor="age" className="text-sm font-medium">
            Idade (anos)
          </label>
          <Input
            id="age"
            type="number"
            min="10"
            max="120"
            value={formData.age || ''}
            onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || 0 })}
            placeholder="Digite sua idade"
            className={errors.age ? 'border-destructive focus-visible:ring-destructive' : ''}
          />
          {errors.age ? (
            <p className="text-sm text-destructive flex items-center gap-1">
              <span>⚠</span> {errors.age}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Exemplo: 30 anos
            </p>
          )}
        </div>

        {/* Botão Continuar */}
        <Button
          onClick={handleContinue}
          disabled={!isFormValid}
          className="w-full transition-all hover:scale-[1.02] active:scale-[0.98]"
          size="lg"
        >
          Continuar
        </Button>
      </CardContent>
    </Card>
  )
}

