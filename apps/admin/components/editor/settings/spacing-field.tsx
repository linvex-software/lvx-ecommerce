'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { SpacingConfig } from './types'
import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@white-label/ui'

interface SpacingFieldProps {
  label: string
  value: SpacingConfig
  onChange: (config: SpacingConfig) => void
  type: 'padding' | 'margin'
}

export function SpacingField({ label, value, onChange, type }: SpacingFieldProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  const spacing = value[type]
  const isUniform = typeof spacing === 'number'
  const uniformValue = isUniform ? spacing : undefined
  const individualValues = isUniform 
    ? { top: spacing, right: spacing, bottom: spacing, left: spacing }
    : (spacing || { top: 0, right: 0, bottom: 0, left: 0 })

  const updateUniform = (val: number) => {
    onChange({ ...value, [type]: val })
  }

  const updateIndividual = (side: 'top' | 'right' | 'bottom' | 'left', val: number) => {
    const current = typeof spacing === 'object' ? spacing : {}
    onChange({
      ...value,
      [type]: { ...current, [side]: val }
    })
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{label}</Label>
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-3 w-3" />
              Uniforme
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3" />
              Individual
            </>
          )}
        </button>
      </div>

      {!isExpanded ? (
        <div>
          <Input
            type="number"
            value={uniformValue ?? 0}
            onChange={(e) => updateUniform(Number(e.target.value) || 0)}
            className="h-9"
            min="0"
            placeholder="0"
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs text-gray-600 mb-1 block">Top</Label>
            <Input
              type="number"
              value={individualValues.top ?? 0}
              onChange={(e) => updateIndividual('top', Number(e.target.value) || 0)}
              className="h-9"
              min="0"
            />
          </div>
          <div>
            <Label className="text-xs text-gray-600 mb-1 block">Right</Label>
            <Input
              type="number"
              value={individualValues.right ?? 0}
              onChange={(e) => updateIndividual('right', Number(e.target.value) || 0)}
              className="h-9"
              min="0"
            />
          </div>
          <div>
            <Label className="text-xs text-gray-600 mb-1 block">Bottom</Label>
            <Input
              type="number"
              value={individualValues.bottom ?? 0}
              onChange={(e) => updateIndividual('bottom', Number(e.target.value) || 0)}
              className="h-9"
              min="0"
            />
          </div>
          <div>
            <Label className="text-xs text-gray-600 mb-1 block">Left</Label>
            <Input
              type="number"
              value={individualValues.left ?? 0}
              onChange={(e) => updateIndividual('left', Number(e.target.value) || 0)}
              className="h-9"
              min="0"
            />
          </div>
        </div>
      )}
    </div>
  )
}


