'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { X, ChevronDown, ChevronUp } from 'lucide-react'

export interface FilterState {
    categories: string[]
    priceRange: { min: number; max: number }
    sizes: string[]
    colors: string[]
    searchQuery: string
}

interface ProductFiltersProps {
    filters: FilterState
    onFilterChange: (filters: FilterState) => void
    availableCategories: string[]
    availableSizes: string[]
    availableColors: { name: string; hex: string }[]
}

const ProductFilters = ({
    filters,
    onFilterChange,
    availableCategories,
    availableSizes,
    availableColors,
}: ProductFiltersProps) => {
    const [expandedSections, setExpandedSections] = useState({
        category: true,
        price: true,
        size: true,
        color: true,
    })

    const toggleSection = (section: keyof typeof expandedSections) => {
        setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }))
    }

    const toggleCategory = (category: string) => {
        const newCategories = filters.categories.includes(category)
            ? filters.categories.filter((c) => c !== category)
            : [...filters.categories, category]
        onFilterChange({ ...filters, categories: newCategories })
    }

    const toggleSize = (size: string) => {
        const newSizes = filters.sizes.includes(size)
            ? filters.sizes.filter((s) => s !== size)
            : [...filters.sizes, size]
        onFilterChange({ ...filters, sizes: newSizes })
    }

    const toggleColor = (color: string) => {
        const newColors = filters.colors.includes(color)
            ? filters.colors.filter((c) => c !== color)
            : [...filters.colors, color]
        onFilterChange({ ...filters, colors: newColors })
    }

    const updatePriceRange = (type: 'min' | 'max', value: number) => {
        onFilterChange({
            ...filters,
            priceRange: { ...filters.priceRange, [type]: value },
        })
    }

    const clearAllFilters = () => {
        onFilterChange({
            categories: [],
            priceRange: { min: 0, max: 1000 },
            sizes: [],
            colors: [],
            searchQuery: '',
        })
    }

    const hasActiveFilters =
        filters.categories.length > 0 ||
        filters.sizes.length > 0 ||
        filters.colors.length > 0 ||
        filters.priceRange.min > 0 ||
        filters.priceRange.max < 1000

    return (
        <Card className="p-6 space-y-6 sticky top-24">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Filtros</h2>
                {hasActiveFilters && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearAllFilters}
                        className="text-xs hover:text-destructive"
                    >
                        <X className="w-4 h-4 mr-1" />
                        Limpar
                    </Button>
                )}
            </div>

            {/* Category Filter */}
            <div className="border-b border-border pb-4">
                <button
                    onClick={() => toggleSection('category')}
                    className="flex items-center justify-between w-full text-left mb-3"
                >
                    <h3 className="font-semibold text-sm uppercase tracking-wider">Categoria</h3>
                    {expandedSections.category ? (
                        <ChevronUp className="w-4 h-4" />
                    ) : (
                        <ChevronDown className="w-4 h-4" />
                    )}
                </button>
                {expandedSections.category && (
                    <div className="space-y-2">
                        {availableCategories.map((category) => (
                            <label key={category} className="flex items-center space-x-2 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={filters.categories.includes(category)}
                                    onChange={() => toggleCategory(category)}
                                    className="w-4 h-4 border-2 border-border rounded-sm cursor-pointer accent-foreground"
                                />
                                <span className="text-sm group-hover:text-foreground transition-colors">
                                    {category}
                                </span>
                            </label>
                        ))}
                    </div>
                )}
            </div>

            {/* Price Range Filter */}
            <div className="border-b border-border pb-4">
                <button
                    onClick={() => toggleSection('price')}
                    className="flex items-center justify-between w-full text-left mb-3"
                >
                    <h3 className="font-semibold text-sm uppercase tracking-wider">Preço</h3>
                    {expandedSections.price ? (
                        <ChevronUp className="w-4 h-4" />
                    ) : (
                        <ChevronDown className="w-4 h-4" />
                    )}
                </button>
                {expandedSections.price && (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs text-muted-foreground">Mínimo</label>
                            <input
                                type="range"
                                min="0"
                                max="1000"
                                step="10"
                                value={filters.priceRange.min}
                                onChange={(e) => updatePriceRange('min', Number(e.target.value))}
                                className="w-full accent-foreground"
                            />
                            <p className="text-sm font-medium">R$ {filters.priceRange.min.toFixed(2)}</p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs text-muted-foreground">Máximo</label>
                            <input
                                type="range"
                                min="0"
                                max="1000"
                                step="10"
                                value={filters.priceRange.max}
                                onChange={(e) => updatePriceRange('max', Number(e.target.value))}
                                className="w-full accent-foreground"
                            />
                            <p className="text-sm font-medium">R$ {filters.priceRange.max.toFixed(2)}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Size Filter */}
            <div className="border-b border-border pb-4">
                <button
                    onClick={() => toggleSection('size')}
                    className="flex items-center justify-between w-full text-left mb-3"
                >
                    <h3 className="font-semibold text-sm uppercase tracking-wider">Tamanho</h3>
                    {expandedSections.size ? (
                        <ChevronUp className="w-4 h-4" />
                    ) : (
                        <ChevronDown className="w-4 h-4" />
                    )}
                </button>
                {expandedSections.size && (
                    <div className="flex flex-wrap gap-2">
                        {availableSizes.map((size) => (
                            <button
                                key={size}
                                onClick={() => toggleSize(size)}
                                className={`px-4 py-2 border-2 text-sm font-medium transition-all ${filters.sizes.includes(size)
                                    ? 'border-foreground bg-foreground text-background'
                                    : 'border-border hover:border-foreground'
                                    }`}
                            >
                                {size}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Color Filter */}
            <div>
                <button
                    onClick={() => toggleSection('color')}
                    className="flex items-center justify-between w-full text-left mb-3"
                >
                    <h3 className="font-semibold text-sm uppercase tracking-wider">Cor</h3>
                    {expandedSections.color ? (
                        <ChevronUp className="w-4 h-4" />
                    ) : (
                        <ChevronDown className="w-4 h-4" />
                    )}
                </button>
                {expandedSections.color && (
                    <div className="flex flex-wrap gap-3">
                        {availableColors.map((color) => (
                            <button
                                key={color.name}
                                onClick={() => toggleColor(color.name)}
                                className={`group relative w-10 h-10 rounded-full border-2 transition-all ${filters.colors.includes(color.name)
                                    ? 'border-foreground scale-110'
                                    : 'border-border hover:border-foreground hover:scale-105'
                                    }`}
                                title={color.name}
                            >
                                <div
                                    className="w-full h-full rounded-full"
                                    style={{ backgroundColor: color.hex }}
                                />
                                {filters.colors.includes(color.name) && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-3 h-3 bg-white rounded-full border-2 border-foreground" />
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </Card>
    )
}

export default ProductFilters
