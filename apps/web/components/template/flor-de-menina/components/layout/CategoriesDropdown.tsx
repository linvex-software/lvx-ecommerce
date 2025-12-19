'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Category {
  id: string
  name: string
  slug: string
}

interface CategoriesDropdownProps {
  categories: Category[]
  className?: string
  isMobile?: boolean
}

const INITIAL_DISPLAY_COUNT = 8 // Número inicial de categorias a mostrar
const LOAD_MORE_COUNT = 8 // Quantas categorias carregar ao clicar em "Mostrar mais"

export function CategoriesDropdown({ 
  categories, 
  className,
  isMobile = false 
}: CategoriesDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [displayCount, setDisplayCount] = useState(INITIAL_DISPLAY_COUNT)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Fechar dropdown ao pressionar Escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false)
        buttonRef.current?.focus()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  // Navegação por teclado
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      setIsOpen(!isOpen)
    } else if (event.key === 'ArrowDown' && !isOpen) {
      event.preventDefault()
      setIsOpen(true)
    }
  }

  const handleLoadMore = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDisplayCount(prev => Math.min(prev + LOAD_MORE_COUNT, categories.length))
  }

  const visibleCategories = categories.slice(0, displayCount)
  const hasMore = displayCount < categories.length

  if (!categories || categories.length === 0) {
    return null
  }

  return (
    <div className={cn('relative', className)}>
      {/* Botão do dropdown */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        onMouseEnter={() => {
          if (!isMobile) {
            setIsOpen(true)
          }
        }}
        className={cn(
          'flex items-center gap-1 font-body tracking-wide text-foreground/80 hover:text-primary transition-colors duration-200 relative group',
          isMobile ? 'text-lg py-3 w-full justify-between' : 'text-sm',
          isOpen && 'text-primary'
        )}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="Categorias"
        aria-controls="categories-dropdown-menu"
      >
        <span>Categorias</span>
        {isOpen ? (
          <ChevronUp size={16} className="transition-transform" aria-hidden="true" />
        ) : (
          <ChevronDown size={16} className="transition-transform" aria-hidden="true" />
        )}
        {!isMobile && (
          <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
        )}
      </button>

      {/* Menu dropdown */}
      {isOpen && (
        <div
          id="categories-dropdown-menu"
          ref={dropdownRef}
          className={cn(
            'bg-background border border-border rounded-lg shadow-lg',
            isMobile 
              ? 'relative mt-2 w-full max-h-[70vh] overflow-y-auto z-50' 
              : 'absolute top-full left-0 mt-2 min-w-[200px] max-w-[300px] max-h-[60vh] overflow-y-auto z-[10000]'
          )}
          role="menu"
          aria-label="Lista de categorias"
        >
          <div className="py-2">
            {visibleCategories.map((category, index) => (
              <Link
                key={category.id}
                href={`/categoria/${category.slug}`}
                onClick={() => setIsOpen(false)}
                className={cn(
                  'block px-4 py-2 text-sm font-body text-foreground/80 hover:text-primary hover:bg-muted/50 transition-colors',
                  'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset'
                )}
                role="menuitem"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setIsOpen(false)
                    window.location.href = `/categoria/${category.slug}`
                  }
                }}
              >
                {category.name}
              </Link>
            ))}

            {/* Botão "Mostrar mais" */}
            {hasMore && (
              <button
                type="button"
                onClick={handleLoadMore}
                className={cn(
                  'w-full px-4 py-2 text-sm font-body text-primary hover:bg-muted/50 transition-colors',
                  'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset',
                  'border-t border-border mt-1'
                )}
                aria-label={`Mostrar mais ${Math.min(LOAD_MORE_COUNT, categories.length - displayCount)} categorias`}
              >
                Mostrar mais ({categories.length - displayCount} restantes)
              </button>
            )}

            {/* Indicador de total */}
            {!hasMore && categories.length > INITIAL_DISPLAY_COUNT && (
              <div className="px-4 py-2 text-xs text-foreground/60 border-t border-border mt-1">
                {categories.length} categorias
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

