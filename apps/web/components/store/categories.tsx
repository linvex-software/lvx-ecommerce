'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { CATEGORY_ICONS, getIconComponent } from '@/lib/constants/category-icons'
import { fetchAPI } from '@/lib/api'

interface Category {
  id: string
  name: string
  slug: string
  icon?: string | null
}

interface CategoriesProps {
  title?: string
}

export function Categories({ title = 'Escolha por categoria' }: CategoriesProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [currentPage, setCurrentPage] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  // Responsivo: menos itens no mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const itemsPerPage = isMobile ? 3 : 5

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await fetchAPI('/categories') as { categories: Category[] }
        if (response?.categories && Array.isArray(response.categories)) {
          setCategories(response.categories)
        } else if (Array.isArray(response)) {
          // Fallback caso a API retorne array diretamente
          setCategories(response)
        }
      } catch (error) {
        console.error('Erro ao carregar categorias:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadCategories()
  }, [])

  const totalPages = Math.ceil(categories.length / itemsPerPage)
  const startIndex = currentPage * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentCategories = categories.slice(startIndex, endIndex)

  const handleNext = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1)
    }
  }

  const handlePrev = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1)
    }
  }

  if (isLoading) {
    return (
      <div className="py-8">
        <div className="text-center" style={{ color: 'var(--store-text-color, #000000)' }}>Carregando categorias...</div>
      </div>
    )
  }

  if (categories.length === 0) {
    return null
  }

  return (
    <div className="py-8 px-4 md:px-6 w-full overflow-hidden">
      <h2 className="text-2xl font-bold text-center mb-6" style={{ color: 'var(--store-text-color, #000000)' }}>{title}</h2>
      
      <div className="relative max-w-6xl mx-auto w-full">
        {/* Carrossel */}
        <div className="flex items-center gap-2 md:gap-4 w-full">
          {/* Botão Anterior */}
          {currentPage > 0 && (
            <button
              onClick={handlePrev}
              className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors z-10"
              aria-label="Categoria anterior"
            >
              <ChevronRight className="w-4 h-4 md:w-5 md:h-5 rotate-180" style={{ color: 'var(--store-icon-color, #000000)' }} />
            </button>
          )}

          {/* Categorias */}
          <div className="flex-1 flex items-center justify-center gap-3 md:gap-6 overflow-x-auto scrollbar-hide min-w-0">
            <div className="flex items-center gap-3 md:gap-6">
            {currentCategories.map((category) => {
              const IconComponent = getIconComponent(category.icon)
              const DefaultIcon = CATEGORY_ICONS[0]?.component

              return (
                <Link
                  key={category.id}
                  href={`/categoria/${category.slug}`}
                    className="flex flex-col items-center gap-2 md:gap-3 flex-shrink-0 group min-w-[80px] md:min-w-0"
                >
                    <div className="w-20 h-20 md:w-28 md:h-28 lg:w-40 lg:h-40 rounded-full bg-gray-100 group-hover:bg-gray-200 transition-colors flex items-center justify-center">
                    {IconComponent ? (
                        <IconComponent className="w-10 h-10 md:w-14 md:h-14 lg:w-20 lg:h-20" style={{ color: 'var(--store-icon-color, #000000)' }} />
                    ) : DefaultIcon ? (
                        <DefaultIcon className="w-10 h-10 md:w-14 md:h-14 lg:w-20 lg:h-20" style={{ color: 'var(--store-icon-color, #000000)' }} />
                    ) : null}
                  </div>
                    <span className="text-xs md:text-sm font-medium text-center max-w-[80px] md:max-w-none" style={{ color: 'var(--store-text-color, #000000)' }}>
                    {category.name}
                  </span>
                </Link>
              )
            })}
            </div>
          </div>

          {/* Botão Próximo */}
          {currentPage < totalPages - 1 && (
            <button
              onClick={handleNext}
              className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors z-10"
              aria-label="Próxima categoria"
            >
              <ChevronRight className="w-4 h-4 md:w-5 md:h-5" style={{ color: 'var(--store-icon-color, #000000)' }} />
            </button>
          )}
        </div>

        {/* Indicadores de página */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            {Array.from({ length: totalPages }).map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentPage(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentPage ? 'bg-gray-900' : 'bg-gray-300'
                }`}
                aria-label={`Ir para página ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

