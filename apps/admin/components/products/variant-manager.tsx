'use client'

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@white-label/ui'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export interface ProductVariant {
  size?: string | null
  color?: string | null
  sku?: string | null
  barcode?: string | null
  price_override?: number | null
  active?: boolean
}

interface VariantManagerProps {
  variants: ProductVariant[]
  onChange: (variants: ProductVariant[]) => void
}

export function VariantManager({ variants, onChange }: VariantManagerProps) {
  const addVariant = () => {
    onChange([
      ...variants,
      {
        size: null,
        color: null,
        sku: null,
        price_override: null,
        active: true
      }
    ])
  }

  const removeVariant = (index: number) => {
    if (!confirm('Tem certeza que deseja excluir esta variante?')) {
      return
    }
    onChange(variants.filter((_, i) => i !== index))
  }

  const updateVariant = (index: number, field: keyof ProductVariant, value: string | number | boolean | null) => {
    const updated = [...variants]
    updated[index] = {
      ...updated[index],
      [field]: value
    }
    onChange(updated)
  }

  return (
    <Card className="dark:bg-surface-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-semibold">Variantes</CardTitle>
            <CardDescription>Tamanho, cor e outras variações do produto</CardDescription>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addVariant} className="gap-2">
            <Plus className="h-4 w-4" />
            Adicionar variante
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {variants.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-8 text-center dark:border-[#2A2A2A]">
            <p className="text-sm text-text-secondary">Nenhuma variante adicionada</p>
            <p className="mt-1 text-xs text-text-tertiary">
              Adicione variantes para produtos com diferentes tamanhos ou cores
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {variants.map((variant, index) => (
              <div
                key={index}
                className="rounded-lg border border-border bg-surface p-4 dark:bg-surface-2 dark:border-[#2A2A2A]"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-text-primary">
                    Variante #{index + 1}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeVariant(index)}
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor={`variant-size-${index}`}>Tamanho</Label>
                    <Input
                      id={`variant-size-${index}`}
                      placeholder="Ex: P, M, G, GG..."
                      value={variant.size || ''}
                      onChange={(e) => updateVariant(index, 'size', e.target.value || null)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`variant-color-${index}`}>Cor</Label>
                    <Input
                      id={`variant-color-${index}`}
                      placeholder="Ex: Preto, Branco, Azul..."
                      value={variant.color || ''}
                      onChange={(e) => updateVariant(index, 'color', e.target.value || null)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`variant-sku-${index}`}>SKU (opcional)</Label>
                    <Input
                      id={`variant-sku-${index}`}
                      placeholder="SKU único da variante"
                      value={variant.sku || ''}
                      onChange={(e) => updateVariant(index, 'sku', e.target.value || null)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`variant-barcode-${index}`}>Código de Barras (opcional)</Label>
                    <Input
                      id={`variant-barcode-${index}`}
                      placeholder="1234567890123"
                      value={variant.barcode || ''}
                      onChange={(e) => updateVariant(index, 'barcode', e.target.value || null)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`variant-price-${index}`}>
                      Preço adicional (R$)
                    </Label>
                    <Input
                      id={`variant-price-${index}`}
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={variant.price_override || ''}
                      onChange={(e) =>
                        updateVariant(
                          index,
                          'price_override',
                          e.target.value ? parseFloat(e.target.value) : null
                        )
                      }
                    />
                    <p className="text-xs text-text-secondary">
                      Valor adicional ao preço base (deixe vazio para usar preço base)
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`variant-active-${index}`}
                    checked={variant.active !== false}
                    onChange={(e) => updateVariant(index, 'active', e.target.checked)}
                    className="h-4 w-4 rounded border-input-border text-primary focus:ring-primary dark:border-[#2A2A2A]"
                  />
                  <Label htmlFor={`variant-active-${index}`} className="cursor-pointer text-sm font-normal text-text-primary">
                    Variante ativa
                  </Label>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

