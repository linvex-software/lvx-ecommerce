'use client'

import { Minus, Plus } from 'lucide-react'
import { Button } from '@white-label/ui'
import { Input } from '../ui/input'

interface QuantityInputProps {
  value: number
  onChange: (value: number) => void
  max?: number
  min?: number
  disabled?: boolean
}

export function QuantityInput({ value, onChange, max, min = 1, disabled = false }: QuantityInputProps) {
  const handleDecrease = () => {
    const newValue = Math.max(min, value - 1)
    onChange(newValue)
  }

  const handleIncrease = () => {
    const newValue = max !== undefined ? Math.min(max, value + 1) : value + 1
    onChange(newValue)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value) || min
    if (max !== undefined) {
      onChange(Math.min(max, Math.max(min, newValue)))
    } else {
      onChange(Math.max(min, newValue))
    }
  }

  const isMaxReached = max !== undefined && value >= max
  const isMinReached = value <= min

  return (
    <div className="flex items-center gap-3">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleDecrease}
        disabled={disabled || isMinReached}
        className="h-12 w-12 border-gray-300 hover:border-gray-900 transition-colors"
      >
        <Minus className="h-5 w-5" />
      </Button>
      <Input
        type="number"
        value={value}
        onChange={handleChange}
        min={min}
        max={max}
        disabled={disabled}
        className="w-24 text-center text-xl font-bold border-gray-300"
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleIncrease}
        disabled={disabled || isMaxReached}
        className="h-12 w-12 border-gray-300 hover:border-gray-900 transition-colors"
      >
        <Plus className="h-5 w-5" />
      </Button>
    </div>
  )
}

