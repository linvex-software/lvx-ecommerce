'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@white-label/ui'

interface ColorPickerProps {
  label: string
  value: string
  onChange: (color: string) => void
  description?: string
}

export function ColorPicker({ label, value, onChange, description }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false)

  const presetColors = [
    '#000000', // Preto
    '#FFFFFF', // Branco
    '#6366F1', // Indigo
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#F43F5E', // Rose
    '#EF4444', // Red
    '#F97316', // Orange
    '#F59E0B', // Amber
    '#10B981', // Emerald
    '#14B8A6', // Teal
    '#06B6D4', // Cyan
    '#3B82F6', // Blue
    '#0F172A' // Slate
  ]

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      {description && (
        <p className="text-xs text-gray-500">{description}</p>
      )}
      
      <div className="flex items-center gap-3">
        {/* Preview da cor atual */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="h-12 w-12 rounded-xl border-2 border-gray-200 shadow-sm transition-all hover:scale-105 hover:shadow-md"
            style={{ backgroundColor: value }}
          >
            {value === '#FFFFFF' && (
              <div className="absolute inset-0 rounded-xl border border-gray-300" />
            )}
          </button>
          
          {/* Color picker nativo */}
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </div>

        {/* Input de texto para código hex */}
        <div className="flex-1">
          <input
            type="text"
            value={value}
            onChange={(e) => {
              const color = e.target.value
              if (/^#[0-9A-F]{6}$/i.test(color) || color === '') {
                onChange(color || '#000000')
              }
            }}
            placeholder="#000000"
            className="h-11 w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-mono ring-offset-white placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2"
          />
        </div>
      </div>

      {/* Cores predefinidas */}
      {isOpen && (
        <div className="mt-3 rounded-xl border border-gray-200 bg-white p-4 shadow-lg">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.35em] text-gray-400">
            Cores predefinidas
          </p>
          <div className="grid grid-cols-7 gap-2">
            {presetColors.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => {
                  onChange(color)
                  setIsOpen(false)
                }}
                className={cn(
                  'relative h-10 w-10 rounded-lg border-2 transition-all hover:scale-110',
                  value === color ? 'border-gray-900 shadow-md' : 'border-gray-200'
                )}
                style={{ backgroundColor: color }}
              >
                {value === color && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Check className="h-4 w-4 text-white drop-shadow-md" />
                  </div>
                )}
                {color === '#FFFFFF' && value !== color && (
                  <div className="absolute inset-0 rounded-lg border border-gray-300" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

