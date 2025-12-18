'use client'

import { Label } from '@/components/ui/label'
import { ImageUpload } from '@/components/products/image-upload'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ImageConfig } from './types'
import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@white-label/ui'

interface ImageFieldProps {
  label: string
  value: ImageConfig
  onChange: (config: ImageConfig) => void
  showAdvanced?: boolean
}

const OBJECT_FIT_OPTIONS = [
  { value: 'cover', label: 'Cover' },
  { value: 'contain', label: 'Contain' },
  { value: 'fill', label: 'Fill' },
  { value: 'none', label: 'None' },
  { value: 'scale-down', label: 'Scale Down' }
] as const

export function ImageField({
  label,
  value,
  onChange,
  showAdvanced = true
}: ImageFieldProps) {
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false)

  const updateValue = (key: keyof ImageConfig, val: any) => {
    onChange({ ...value, [key]: val })
  }

  const updateFilter = (key: keyof NonNullable<ImageConfig['filters']>, val: number) => {
    onChange({
      ...value,
      filters: {
        ...value.filters,
        [key]: val
      }
    })
  }

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">{label}</Label>
      
      <ImageUpload
        value={value.url}
        onChange={(url) => updateValue('url', url)}
      />

      {value.url && showAdvanced && (
        <>
          <div className="pt-2 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
              className="flex items-center gap-2 text-xs text-gray-600 hover:text-gray-900"
            >
              {showAdvancedOptions ? (
                <>
                  <ChevronUp className="h-3 w-3" />
                  Ocultar opções avançadas
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3" />
                  Mostrar opções avançadas
                </>
              )}
            </button>
          </div>

          {showAdvancedOptions && (
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-gray-600 mb-1 block">Object Fit</Label>
                  <Select
                    value={value.objectFit || 'cover'}
                    onValueChange={(val) => updateValue('objectFit', val)}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {OBJECT_FIT_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="text-xs text-gray-600 mb-1 block">Border Radius (px)</Label>
                  <Input
                    type="number"
                    value={value.borderRadius ?? 0}
                    onChange={(e) => updateValue('borderRadius', Number(e.target.value) || 0)}
                    className="h-9"
                    min="0"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs text-gray-600 mb-1 block">Position</Label>
                <Input
                  type="text"
                  value={value.position || 'center'}
                  onChange={(e) => updateValue('position', e.target.value)}
                  className="h-9"
                  placeholder="center, top, bottom, left, right..."
                />
              </div>

              <div>
                <Label className="text-xs text-gray-600 mb-1 block">Aspect Ratio</Label>
                <Input
                  type="text"
                  value={value.aspectRatio || ''}
                  onChange={(e) => updateValue('aspectRatio', e.target.value)}
                  className="h-9"
                  placeholder="16/9, 1/1, 4/3..."
                />
              </div>

              <div className="pt-2 border-t border-gray-100">
                <Label className="text-xs font-semibold text-gray-700 mb-2 block">Filtros</Label>
                <div className="space-y-2">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <Label className="text-xs text-gray-600">Brilho</Label>
                      <span className="text-xs text-gray-500">{value.filters?.brightness ?? 100}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="200"
                      value={value.filters?.brightness ?? 100}
                      onChange={(e) => updateFilter('brightness', Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <Label className="text-xs text-gray-600">Contraste</Label>
                      <span className="text-xs text-gray-500">{value.filters?.contrast ?? 100}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="200"
                      value={value.filters?.contrast ?? 100}
                      onChange={(e) => updateFilter('contrast', Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <Label className="text-xs text-gray-600">Escala de Cinza</Label>
                      <span className="text-xs text-gray-500">{value.filters?.grayscale ?? 0}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={value.filters?.grayscale ?? 0}
                      onChange={(e) => updateFilter('grayscale', Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <Label className="text-xs text-gray-600">Desfoque</Label>
                      <span className="text-xs text-gray-500">{value.filters?.blur ?? 0}px</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      value={value.filters?.blur ?? 0}
                      onChange={(e) => updateFilter('blur', Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

