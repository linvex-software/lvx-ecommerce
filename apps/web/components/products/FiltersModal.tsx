'use client'

import { useEffect, useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/template/flor-de-menina/components/ui/sheet'
import { FiltersContent } from './FiltersContent'
import { Button } from '@/components/template/flor-de-menina/components/ui/button'

interface Category {
  id: string
  name: string
  slug: string
}

interface FiltersModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
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
  onClearFilters: () => void
  onApplyFilters: () => void
  hasActiveFilters: boolean
  totalResults: number
}

export function FiltersModal({
  open,
  onOpenChange,
  categories,
  effectiveCategoryId,
  filtersFromUrl,
  availableSizes,
  availableColors,
  onToggleCategory,
  onToggleSize,
  onToggleColor,
  onUpdatePriceRange,
  onClearFilters,
  onApplyFilters,
  hasActiveFilters,
  totalResults,
}: FiltersModalProps) {
  const [isMobile, setIsMobile] = useState(false)

  // Detectar se é mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Travar scroll do body quando modal aberto
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  // Fechar com ESC (já implementado pelo Sheet do Radix)
  // Fechar ao clicar no overlay (já implementado pelo Sheet do Radix)

  const handleApply = () => {
    onApplyFilters()
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isMobile ? "bottom" : "left"}
        className={isMobile ? "w-full max-h-[90vh] rounded-t-lg p-0" : "w-full sm:w-[400px] sm:max-w-sm p-0"}
      >
        <div className="flex flex-col h-full max-h-[90vh] sm:max-h-full">
          <SheetHeader className="px-6 pt-6 pb-4 border-b border-border flex-shrink-0">
            <SheetTitle className="text-left">Filtros</SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-hidden min-h-0">
            <div className="h-full px-6 py-4 overflow-y-auto">
              <FiltersContent
                categories={categories}
                effectiveCategoryId={effectiveCategoryId}
                filtersFromUrl={filtersFromUrl}
                availableSizes={availableSizes}
                availableColors={availableColors}
                onToggleCategory={onToggleCategory}
              onToggleSize={onToggleSize}
              onToggleColor={onToggleColor}
              onUpdatePriceRange={onUpdatePriceRange}
              hasActiveFilters={hasActiveFilters}
              />
            </div>
          </div>

          {/* Footer fixo com botões */}
          <div className="px-6 py-4 border-t border-border bg-background space-y-2 flex-shrink-0">
            <Button
              onClick={handleApply}
              className="w-full"
            >
              Aplicar Filtros
            </Button>
            {hasActiveFilters && (
              <Button
                variant="outline"
                onClick={onClearFilters}
                className="w-full"
              >
                Limpar
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

