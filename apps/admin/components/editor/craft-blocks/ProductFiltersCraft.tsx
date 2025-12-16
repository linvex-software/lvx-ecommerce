'use client'

import React, { useState } from 'react'
import { Button } from '@white-label/ui'
import { Card } from '@/components/ui/card'
import { X, ChevronDown, ChevronUp } from 'lucide-react'

export interface FilterState {
  categories: string[]
  priceRange: { min: number; max: number }
  sizes: string[]
  colors: string[]
  searchQuery: string
}

interface ProductFiltersCraftProps {
  filters: FilterState
  onFilterChange: (filters: FilterState) => void
  availableCategories: string[]
  availableSizes: string[]
  availableColors: { name: string; hex: string }[]
}

export function ProductFiltersCraft({
  filters,
  onFilterChange,
  availableCategories,
  availableSizes,
  availableColors,
}: ProductFiltersCraftProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['categories', 'price', 'sizes', 'colors']))

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev)
      if (next.has(section)) {
        next.delete(section)
      } else {
        next.add(section)
      }
      return next
    })
  }

  const updateFilters = (updates: Partial<FilterState>) => {
    onFilterChange({ ...filters, ...updates })
  }

  const toggleCategory = (category: string) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter(c => c !== category)
      : [...filters.categories, category]
    updateFilters({ categories: newCategories })
  }

  const toggleSize = (size: string) => {
    const newSizes = filters.sizes.includes(size)
      ? filters.sizes.filter(s => s !== size)
      : [...filters.sizes, size]
    updateFilters({ sizes: newSizes })
  }

  const toggleColor = (color: string) => {
    const newColors = filters.colors.includes(color)
      ? filters.colors.filter(c => c !== color)
      : [...filters.colors, color]
    updateFilters({ colors: newColors })
  }

  const clearFilters = () => {
    onFilterChange({
      categories: [],
      priceRange: { min: 0, max: 1000 },
      sizes: [],
      colors: [],
      searchQuery: '',
    })
  }

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Filtros</h3>
        {(filters.categories.length > 0 || filters.sizes.length > 0 || filters.colors.length > 0 || filters.priceRange.min > 0 || filters.priceRange.max < 1000) && (
          <Button variant="outline" size="sm" onClick={clearFilters}>
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Categories */}
      <div>
        <button
          onClick={() => toggleSection('categories')}
          className="w-full flex items-center justify-between mb-2"
        >
          <span className="font-medium">Categorias</span>
          {expandedSections.has('categories') ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
        {expandedSections.has('categories') && (
          <div className="space-y-2">
            {availableCategories.map(category => (
              <label key={category} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.categories.includes(category)}
                  onChange={() => toggleCategory(category)}
                  className="rounded"
                />
                <span className="text-sm">{category}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Price Range */}
      <div>
        <button
          onClick={() => toggleSection('price')}
          className="w-full flex items-center justify-between mb-2"
        >
          <span className="font-medium">Preço</span>
          {expandedSections.has('price') ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
        {expandedSections.has('price') && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={filters.priceRange.min}
                onChange={(e) => updateFilters({ priceRange: { ...filters.priceRange, min: parseFloat(e.target.value) || 0 } })}
                className="w-full px-2 py-1 border rounded text-sm"
                placeholder="Min"
              />
              <span className="text-muted-foreground">-</span>
              <input
                type="number"
                value={filters.priceRange.max}
                onChange={(e) => updateFilters({ priceRange: { ...filters.priceRange, max: parseFloat(e.target.value) || 1000 } })}
                className="w-full px-2 py-1 border rounded text-sm"
                placeholder="Max"
              />
            </div>
          </div>
        )}
      </div>

      {/* Sizes */}
      {availableSizes.length > 0 && (
        <div>
          <button
            onClick={() => toggleSection('sizes')}
            className="w-full flex items-center justify-between mb-2"
          >
            <span className="font-medium">Tamanhos</span>
            {expandedSections.has('sizes') ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
          {expandedSections.has('sizes') && (
            <div className="flex flex-wrap gap-2">
              {availableSizes.map(size => (
                <button
                  key={size}
                  onClick={() => toggleSize(size)}
                  className={`px-3 py-1 rounded border text-sm ${
                    filters.sizes.includes(size)
                      ? 'bg-foreground text-background border-foreground'
                      : 'bg-background text-foreground border-border hover:border-foreground'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Colors */}
      {availableColors.length > 0 && (
        <div>
          <button
            onClick={() => toggleSection('colors')}
            className="w-full flex items-center justify-between mb-2"
          >
            <span className="font-medium">Cores</span>
            {expandedSections.has('colors') ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
          {expandedSections.has('colors') && (
            <div className="flex flex-wrap gap-2">
              {availableColors.map(color => (
                <button
                  key={color.name}
                  onClick={() => toggleColor(color.name)}
                  className={`w-8 h-8 rounded border-2 ${
                    filters.colors.includes(color.name)
                      ? 'border-foreground scale-110'
                      : 'border-border hover:border-foreground'
                  }`}
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  )
}












