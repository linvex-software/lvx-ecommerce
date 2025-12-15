'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/template/flor-de-menina/components/ui/button'

interface Category {
  id: string
  name: string
  slug: string
}

interface FiltersContentProps {
  categories: Category[]
  effectiveCategoryId: string | null
  filtersFromUrl: {
    sizes: string[]
    colors: string[]
    minPrice: string | null
    maxPrice: string | null
  }
  availableSizes: string[]
  availableColors: { name: string; hex: string }[]
  onToggleCategory: (categoryId: string) => void
  onToggleSize: (size: string) => void
  onToggleColor: (color: string) => void
  onUpdatePriceRange: (type: 'min' | 'max', value: string) => void
  hasActiveFilters: boolean
}

export function FiltersContent({
  categories,
  effectiveCategoryId,
  filtersFromUrl,
  availableSizes,
  availableColors,
  onToggleCategory,
  onToggleSize,
  onToggleColor,
  onUpdatePriceRange,
  hasActiveFilters,
}: FiltersContentProps) {
  const [expandedSections, setExpandedSections] = useState({
    category: true,
    price: true,
    size: true,
    color: true,
  })

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
        <h2 className="font-display text-xl font-semibold">Filtros</h2>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto pr-2 -mr-2">
        {/* Categories */}
        <div className="mb-6">
          <button
            onClick={() => toggleSection('category')}
            className="flex items-center justify-between w-full text-left mb-4"
          >
            <h4 className="font-display text-lg font-medium">Categorias</h4>
            {expandedSections.category ? (
              <ChevronUp size={18} className="text-muted-foreground" />
            ) : (
              <ChevronDown size={18} className="text-muted-foreground" />
            )}
          </button>
          {expandedSections.category && (
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => onToggleCategory('')}
                  className={cn(
                    "w-full text-left text-sm font-body py-2 px-3 rounded-md hover:bg-secondary transition-colors",
                    !effectiveCategoryId ? "bg-primary text-primary-foreground font-medium" : "text-foreground"
                  )}
                >
                  Todas as categorias
                </button>
              </li>
              {categories.map((cat) => (
                <li key={cat.id}>
                  <button
                    onClick={() => onToggleCategory(cat.id)}
                    className={cn(
                      "w-full text-left text-sm font-body py-2 px-3 rounded-md hover:bg-secondary transition-colors",
                      effectiveCategoryId === cat.id ? "bg-primary text-primary-foreground font-medium" : "text-foreground"
                    )}
                  >
                    {cat.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Price Range */}
        <div className="mb-6">
          <button
            onClick={() => toggleSection('price')}
            className="flex items-center justify-between w-full text-left mb-4"
          >
            <h4 className="font-display text-lg font-medium">Preço</h4>
            {expandedSections.price ? (
              <ChevronUp size={18} className="text-muted-foreground" />
            ) : (
              <ChevronDown size={18} className="text-muted-foreground" />
            )}
          </button>
          {expandedSections.price && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground font-medium">Mínimo</label>
                <input
                  type="number"
                  min="0"
                  value={filtersFromUrl.minPrice || ''}
                  onChange={(e) => onUpdatePriceRange('min', e.target.value)}
                  placeholder="R$ 0"
                  className="w-full border border-border px-3 py-2 text-sm font-body rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground font-medium">Máximo</label>
                <input
                  type="number"
                  min="0"
                  value={filtersFromUrl.maxPrice || ''}
                  onChange={(e) => onUpdatePriceRange('max', e.target.value)}
                  placeholder="R$ 1000"
                  className="w-full border border-border px-3 py-2 text-sm font-body rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
                />
              </div>
            </div>
          )}
        </div>

        {/* Sizes */}
        <div className="mb-6">
          <button
            onClick={() => toggleSection('size')}
            className="flex items-center justify-between w-full text-left mb-4"
          >
            <h4 className="font-display text-lg font-medium">Tamanho</h4>
            {expandedSections.size ? (
              <ChevronUp size={18} className="text-muted-foreground" />
            ) : (
              <ChevronDown size={18} className="text-muted-foreground" />
            )}
          </button>
          {expandedSections.size && (
            <div className="flex flex-wrap gap-2">
              {availableSizes.map((size) => (
                <button
                  key={size}
                  onClick={() => onToggleSize(size)}
                  className={cn(
                    "px-4 py-2 text-sm font-body rounded-md border-2 transition-all",
                    filtersFromUrl.sizes.includes(size)
                      ? "border-primary bg-primary text-primary-foreground font-medium"
                      : "border-border hover:border-primary text-foreground bg-background"
                  )}
                >
                  {size}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Colors - Agora com nomes em vez de paleta */}
        <div className="mb-6">
          <button
            onClick={() => toggleSection('color')}
            className="flex items-center justify-between w-full text-left mb-4"
          >
            <h4 className="font-display text-lg font-medium">Cor</h4>
            {expandedSections.color ? (
              <ChevronUp size={18} className="text-muted-foreground" />
            ) : (
              <ChevronDown size={18} className="text-muted-foreground" />
            )}
          </button>
          {expandedSections.color && (
            <div className="flex flex-wrap gap-2">
              {availableColors.map((color) => (
                <button
                  key={color.name}
                  onClick={() => onToggleColor(color.name)}
                  className={cn(
                    "px-4 py-2 text-sm font-body rounded-md border-2 transition-all",
                    filtersFromUrl.colors.includes(color.name)
                      ? "border-primary bg-primary text-primary-foreground font-medium"
                      : "border-border hover:border-primary text-foreground bg-background"
                  )}
                >
                  {color.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

