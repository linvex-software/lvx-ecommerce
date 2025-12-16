'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@white-label/ui'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import type { Coupon } from '@/lib/hooks/use-coupons'

const couponFormSchema = z.object({
  code: z
    .string()
    .min(3, 'Código deve ter no mínimo 3 caracteres')
    .max(20, 'Código deve ter no máximo 20 caracteres')
    .regex(/^[A-Z0-9]+$/, 'Use apenas letras maiúsculas e números'),
  type: z.enum(['percent', 'fixed'], {
    required_error: 'Selecione o tipo de desconto',
  }),
  value: z.coerce.number().positive('Valor deve ser positivo'),
  min_value: z.coerce.number().nullable().optional(),
  max_uses: z.string().optional(),
  expires_in_days: z.string().optional(), // Duração em dias
  active: z.boolean().optional(),
})

type CouponFormData = z.infer<typeof couponFormSchema>

interface CouponFormProps {
  coupon?: Coupon | null
  onSubmit: (data: CouponFormData) => void
  onCancel: () => void
  isLoading?: boolean
}

// Função para calcular dias até a data de expiração
const calculateDaysUntilExpiration = (expiresAt: string | null): string => {
  if (!expiresAt) return 'never'
  
  const expirationDate = new Date(expiresAt)
  const today = new Date()
  
  // Zerar horas para comparação exata de dias
  expirationDate.setHours(0, 0, 0, 0)
  today.setHours(0, 0, 0, 0)
  
  const diffTime = expirationDate.getTime() - today.getTime()
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays <= 0) return 'never' // Já expirado
  
  // Opções disponíveis no select
  const options = [7, 15, 30, 60, 90, 180, 365]
  
  // Retornar a opção mais próxima
  let closest = options[0]
  let minDiff = Math.abs(diffDays - closest)
  
  for (const option of options) {
    const diff = Math.abs(diffDays - option)
    if (diff < minDiff) {
      minDiff = diff
      closest = option
    }
  }
  
  return String(closest)
}

// Função para calcular data de expiração a partir de dias
const calculateExpirationDate = (days: number): Date => {
  const date = new Date()
  date.setDate(date.getDate() + days)
  date.setHours(23, 59, 59, 999) // Fim do dia
  return date
}

export function CouponForm({ coupon, onSubmit, onCancel, isLoading = false }: CouponFormProps) {
  const [selectedType, setSelectedType] = useState<'percent' | 'fixed'>(coupon?.type || 'percent')

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CouponFormData>({
    resolver: zodResolver(couponFormSchema),
    defaultValues: coupon
      ? {
          code: coupon.code,
          type: coupon.type,
          value: coupon.type === 'fixed' 
            ? parseFloat(coupon.value) / 100  // fixed: converter de centavos para reais
            : parseFloat(coupon.value),        // percent: usar direto
          min_value: coupon.min_value ? parseFloat(coupon.min_value) / 100 : undefined,
          max_uses: coupon.max_uses ? String(coupon.max_uses) : '',
          expires_in_days: calculateDaysUntilExpiration(coupon.expires_at),
          active: coupon.active,
        }
      : {
          type: 'percent' as const,
          active: true,
          max_uses: '',
          expires_in_days: 'never',
        },
  })

  const active = watch('active')

  useEffect(() => {
    setValue('type', selectedType)
  }, [selectedType, setValue])

  const onSubmitForm = (data: CouponFormData) => {
    // Calcular data de expiração a partir dos dias
    let expiresAt: string | null = null
    if (data.expires_in_days && data.expires_in_days !== 'never') {
      const days = parseInt(data.expires_in_days, 10)
      if (!isNaN(days) && days > 0) {
        expiresAt = calculateExpirationDate(days).toISOString()
      }
    }

    // Converter valores conforme o tipo
    const formattedData: any = {
      code: data.code.toUpperCase().trim(),
      type: selectedType,
      value: selectedType === 'fixed' ? Math.round(data.value * 100) : data.value,
      min_value: data.min_value ? Math.round(data.min_value * 100) : null,
      max_uses: data.max_uses && data.max_uses.trim() !== '' ? parseInt(data.max_uses, 10) : null,
      expires_at: expiresAt,
      active: data.active,
    }

    onSubmit(formattedData)
  }

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
      {/* Código */}
      <div className="space-y-2">
        <Label htmlFor="code">
          Código do Cupom <span className="text-red-500">*</span>
        </Label>
        <Input
          id="code"
          {...register('code', {
            onChange: (e) => {
              // Converter para maiúsculo em tempo real
              e.target.value = e.target.value.toUpperCase()
            }
          })}
          placeholder="DESCONTO10"
          className="uppercase"
          disabled={isLoading || !!coupon}
        />
        {errors.code && <p className="text-sm text-red-500">{errors.code.message}</p>}
        <p className="text-xs text-muted-foreground">
          Use apenas letras maiúsculas e números (ex: PROMO20, FRETEGRATIS)
        </p>
      </div>

      {/* Tipo */}
      <div className="space-y-2">
        <Label htmlFor="type">
          Tipo de Desconto <span className="text-red-500">*</span>
        </Label>
        <Select
          value={selectedType}
          onValueChange={(value) => setSelectedType(value as 'percent' | 'fixed')}
          disabled={isLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione o tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="percent">Percentual (%)</SelectItem>
            <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
          </SelectContent>
        </Select>
        {errors.type && <p className="text-sm text-red-500">{errors.type.message}</p>}
      </div>

      {/* Valor */}
      <div className="space-y-2">
        <Label htmlFor="value">
          {selectedType === 'percent' ? 'Percentual de Desconto' : 'Valor do Desconto (R$)'}{' '}
          <span className="text-red-500">*</span>
        </Label>
        <Input
          id="value"
          type="number"
          step={selectedType === 'percent' ? '1' : '0.01'}
          {...register('value')}
          placeholder={selectedType === 'percent' ? '10' : '10.00'}
          disabled={isLoading}
        />
        {errors.value && <p className="text-sm text-red-500">{errors.value.message}</p>}
        <p className="text-xs text-muted-foreground">
          {selectedType === 'percent'
            ? 'Ex: 10 para 10% de desconto'
            : 'Ex: 10.00 para R$ 10,00 de desconto'}
        </p>
      </div>

      {/* Valor Mínimo do Pedido */}
      <div className="space-y-2">
        <Label htmlFor="min_value">Valor Mínimo do Pedido (R$)</Label>
        <Input
          id="min_value"
          type="number"
          step="0.01"
          {...register('min_value')}
          placeholder="0.00"
          disabled={isLoading}
        />
        {errors.min_value && <p className="text-sm text-red-500">{errors.min_value.message}</p>}
        <p className="text-xs text-muted-foreground">
          Deixe vazio para não exigir valor mínimo
        </p>
      </div>

      {/* Limite de Usos */}
      <div className="space-y-2">
        <Label htmlFor="max_uses">Limite de Usos</Label>
        <Input
          id="max_uses"
          type="text"
          {...register('max_uses')}
          placeholder="Deixe vazio para ilimitado"
          disabled={isLoading}
        />
        {errors.max_uses && <p className="text-sm text-red-500">{errors.max_uses.message}</p>}
        <p className="text-xs text-muted-foreground">
          Deixe vazio para uso ilimitado ou digite um número
        </p>
      </div>

      {/* Validade em Dias */}
      <div className="space-y-2">
        <Label htmlFor="expires_in_days">Validade</Label>
        <Select
          value={watch('expires_in_days') || 'never'}
          onValueChange={(value) => setValue('expires_in_days', value)}
          disabled={isLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sem expiração" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="never">Sem expiração</SelectItem>
            <SelectItem value="7">7 dias</SelectItem>
            <SelectItem value="15">15 dias</SelectItem>
            <SelectItem value="30">30 dias</SelectItem>
            <SelectItem value="60">60 dias</SelectItem>
            <SelectItem value="90">90 dias</SelectItem>
            <SelectItem value="180">180 dias (6 meses)</SelectItem>
            <SelectItem value="365">365 dias (1 ano)</SelectItem>
          </SelectContent>
        </Select>
        {errors.expires_in_days && <p className="text-sm text-red-500">{errors.expires_in_days.message}</p>}
        <p className="text-xs text-muted-foreground">
          Cupom expirará após o número de dias selecionado a partir de hoje
        </p>
      </div>

      {/* Ativo */}
      {coupon && (
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-0.5">
            <Label htmlFor="active">Status do Cupom</Label>
            <p className="text-sm text-muted-foreground">
              Desative o cupom para impedir novos usos
            </p>
          </div>
          <Switch
            id="active"
            checked={active}
            onChange={(e) => setValue('active', (e.target as HTMLInputElement).checked)}
            disabled={isLoading}
          />
        </div>
      )}

      {/* Botões */}
      <div className="flex gap-3 pt-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Salvando...' : coupon ? 'Atualizar Cupom' : 'Criar Cupom'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}

