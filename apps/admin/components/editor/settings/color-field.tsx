'use client'

import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { ColorPicker } from '@/components/theme/color-picker'
import { THEME_COLORS, type ColorConfig, type ThemeColorName } from './types'
import { Check } from 'lucide-react'
import { cn } from '@white-label/ui'

interface ColorFieldProps {
  label: string
  value: ColorConfig
  onChange: (config: ColorConfig) => void
  description?: string
  showOpacity?: boolean
  showThemeColors?: boolean
}

export function ColorField({
  label,
  value,
  onChange,
  description,
  showOpacity = true,
  showThemeColors = true
}: ColorFieldProps) {
  const [showThemePicker, setShowThemePicker] = useState(false)

  const handleColorChange = (color: string) => {
    onChange({
      ...value,
      type: 'custom',
      value: color
    })
  }

  const handleThemeColorSelect = (themeName: ThemeColorName) => {
    onChange({
      type: 'theme',
      value: themeName,
      opacity: value.opacity
    })
    setShowThemePicker(false)
  }

  const handleOpacityChange = (opacity: number) => {
    onChange({
      ...value,
      opacity: Math.max(0, Math.min(100, opacity))
    })
  }

  const displayColor = value.type === 'theme' 
    ? THEME_COLORS[value.value as ThemeColorName] || value.value
    : value.value

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{label}</Label>
        {showThemeColors && (
          <button
            type="button"
            onClick={() => setShowThemePicker(!showThemePicker)}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            {value.type === 'theme' ? 'Usar cor do tema' : 'Cor personalizada'}
          </button>
        )}
      </div>
      
      {description && (
        <p className="text-xs text-gray-500">{description}</p>
      )}

      {showThemePicker && showThemeColors ? (
        <div className="space-y-2 rounded-lg border border-gray-200 bg-white p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            Cores do Tema
          </p>
          <div className="grid grid-cols-4 gap-2">
            {Object.entries(THEME_COLORS).map(([name, color]) => (
              <button
                key={name}
                type="button"
                onClick={() => handleThemeColorSelect(name as ThemeColorName)}
                className={cn(
                  'relative h-10 w-full rounded-lg border-2 transition-all hover:scale-105',
                  value.type === 'theme' && value.value === name
                    ? 'border-gray-900 shadow-md'
                    : 'border-gray-200'
                )}
                style={{ backgroundColor: color }}
                title={name}
              >
                {value.type === 'theme' && value.value === name && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Check className="h-3 w-3 text-white drop-shadow-md" />
                  </div>
                )}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              onChange({ type: 'custom', value: displayColor, opacity: value.opacity })
              setShowThemePicker(false)
            }}
            className="w-full rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
          >
            Usar cor personalizada
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <ColorPicker
            label=""
            value={displayColor}
            onChange={handleColorChange}
          />
          
          {showOpacity && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label className="text-xs text-gray-600">Opacidade</Label>
                <span className="text-xs text-gray-500">{value.opacity ?? 100}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={value.opacity ?? 100}
                onChange={(e) => handleOpacityChange(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}




