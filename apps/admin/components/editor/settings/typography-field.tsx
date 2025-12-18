'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TypographyConfig } from './types'

interface TypographyFieldProps {
  label?: string
  value: TypographyConfig
  onChange: (config: TypographyConfig) => void
  showResponsive?: boolean
}

const FONT_WEIGHTS = [
  { value: '100', label: 'Thin (100)' },
  { value: '200', label: 'Extra Light (200)' },
  { value: '300', label: 'Light (300)' },
  { value: '400', label: 'Normal (400)' },
  { value: '500', label: 'Medium (500)' },
  { value: '600', label: 'Semi Bold (600)' },
  { value: '700', label: 'Bold (700)' },
  { value: '800', label: 'Extra Bold (800)' },
  { value: '900', label: 'Black (900)' }
] as const

const TEXT_ALIGNS = [
  { value: 'left', label: 'Esquerda' },
  { value: 'center', label: 'Centro' },
  { value: 'right', label: 'Direita' },
  { value: 'justify', label: 'Justificado' }
] as const

const TEXT_TRANSFORMS = [
  { value: 'none', label: 'Nenhum' },
  { value: 'uppercase', label: 'MAIÚSCULAS' },
  { value: 'lowercase', label: 'minúsculas' },
  { value: 'capitalize', label: 'Primeira Letra' }
] as const

export function TypographyField({
  label,
  value,
  onChange,
  showResponsive = false
}: TypographyFieldProps) {
  const updateValue = (key: keyof TypographyConfig, val: any) => {
    onChange({ ...value, [key]: val })
  }

  const fontSize = typeof value.fontSize === 'object' 
    ? value.fontSize.desktop ?? value.fontSize.tablet ?? value.fontSize.mobile ?? 16
    : value.fontSize ?? 16

  return (
    <div className="space-y-3">
      {label && <Label className="text-sm font-medium">{label}</Label>}
      
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-gray-600 mb-1 block">Tamanho (px)</Label>
          <Input
            type="number"
            value={fontSize}
            onChange={(e) => updateValue('fontSize', Number(e.target.value) || 16)}
            className="h-9"
            min="8"
            max="200"
          />
        </div>
        
        <div>
          <Label className="text-xs text-gray-600 mb-1 block">Peso</Label>
          <Select
            value={value.fontWeight || '400'}
            onValueChange={(val) => updateValue('fontWeight', val)}
          >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONT_WEIGHTS.map((fw) => (
                <SelectItem key={fw.value} value={fw.value}>
                  {fw.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label className="text-xs text-gray-600 mb-1 block">Família</Label>
        <Input
          type="text"
          value={value.fontFamily || ''}
          onChange={(e) => updateValue('fontFamily', e.target.value)}
          className="h-9"
          placeholder="Ex: Montserrat, sans-serif"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-gray-600 mb-1 block">Line Height</Label>
          <Input
            type="number"
            step="0.1"
            value={typeof value.lineHeight === 'number' ? value.lineHeight : ''}
            onChange={(e) => updateValue('lineHeight', e.target.value ? Number(e.target.value) : undefined)}
            className="h-9"
            placeholder="1.5"
            min="0.5"
            max="3"
          />
        </div>
        
        <div>
          <Label className="text-xs text-gray-600 mb-1 block">Letter Spacing (px)</Label>
          <Input
            type="number"
            step="0.1"
            value={typeof value.letterSpacing === 'number' ? value.letterSpacing : ''}
            onChange={(e) => updateValue('letterSpacing', e.target.value ? Number(e.target.value) : undefined)}
            className="h-9"
            placeholder="0"
            min="-5"
            max="10"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-gray-600 mb-1 block">Alinhamento</Label>
          <Select
            value={value.textAlign || 'left'}
            onValueChange={(val) => updateValue('textAlign', val as any)}
          >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TEXT_ALIGNS.map((align) => (
                <SelectItem key={align.value} value={align.value}>
                  {align.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label className="text-xs text-gray-600 mb-1 block">Transformação</Label>
          <Select
            value={value.textTransform || 'none'}
            onValueChange={(val) => updateValue('textTransform', val as any)}
          >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TEXT_TRANSFORMS.map((transform) => (
                <SelectItem key={transform.value} value={transform.value}>
                  {transform.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}




