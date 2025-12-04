'use client'

import { ColorField } from './color-field'
import { Label } from '@/components/ui/label'
import { ColorConfig } from './types'

interface ColorSettingsFieldProps {
  label: string
  value: string | ColorConfig | undefined
  useTheme: boolean
  onValueChange: (value: ColorConfig) => void
  onUseThemeChange: (useTheme: boolean) => void
  description?: string
}

/**
 * Campo padronizado para configuração de cores com suporte a tema
 */
export function ColorSettingsField({
  label,
  value,
  useTheme,
  onValueChange,
  onUseThemeChange,
  description
}: ColorSettingsFieldProps) {
  // Converter string para ColorConfig se necessário
  const colorConfig: ColorConfig = typeof value === 'object' && value && 'type' in value
    ? value
    : { type: 'custom', value: (value as string) || '#000000' }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={useTheme}
          onChange={(e) => onUseThemeChange(e.target.checked)}
          className="rounded border-gray-300"
        />
        <Label className="text-sm font-medium">Usar cor do tema</Label>
      </div>
      
      {!useTheme && (
        <ColorField
          label={label}
          value={colorConfig}
          onChange={onValueChange}
          description={description}
        />
      )}
      
      {useTheme && description && (
        <p className="text-xs text-gray-500">{description}</p>
      )}
    </div>
  )
}



