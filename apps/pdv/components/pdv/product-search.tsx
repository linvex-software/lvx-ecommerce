'use client'

import { useState, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '../ui/input'
import { useProducts, type Product } from '@/lib/hooks/use-products'
import { useDebounce } from '@/lib/hooks/use-debounce'

interface ProductSearchProps {
  onSelect: (product: Product) => void
  placeholder?: string
}

export function ProductSearch({ onSelect, placeholder = 'Buscar produto por nome ou SKU...' }: ProductSearchProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedQuery = useDebounce(searchQuery, 300)
  const [showResults, setShowResults] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)

  // Sempre buscar produtos ativos (mesmo sem query)
  const { data, isLoading, error } = useProducts({
    q: debouncedQuery || undefined,
    status: 'active',
    limit: 20
  })

  const products = data?.products || []

  useEffect(() => {
    setSelectedIndex(-1)
  }, [products])

  const handleSelect = (product: Product) => {
    onSelect(product)
    setSearchQuery('')
    setShowResults(false)
    setSelectedIndex(-1)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev < products.length - 1 ? prev + 1 : prev))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault()
      handleSelect(products[selectedIndex])
    } else if (e.key === 'Escape') {
      setShowResults(false)
      setSelectedIndex(-1)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    setShowResults(true)
  }

  return (
    <>
      {/* Backdrop */}
      {showResults && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowResults(false)}
        />
      )}

      <div className="relative">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder={placeholder}
            value={searchQuery}
            onChange={handleInputChange}
            onFocus={() => setShowResults(true)}
            onKeyDown={handleKeyDown}
            className="pl-12 pr-12 h-12 text-base border-gray-300 focus:border-gray-900"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('')
                setShowResults(false)
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {showResults && (
          <div className="absolute z-50 mt-2 w-full rounded-xl border border-gray-200 bg-white shadow-xl">
            {isLoading ? (
              <div className="px-5 py-4 text-sm text-gray-500">Buscando produtos...</div>
            ) : error ? (
              <div className="px-5 py-4 text-sm text-red-600">
                Erro ao buscar produtos. Verifique sua conexão.
              </div>
            ) : products.length === 0 ? (
              <div className="px-5 py-4">
                <p className="text-sm font-medium text-gray-900">
                  {searchQuery ? 'Nenhum produto encontrado' : 'Nenhum produto disponível'}
                </p>
                {!searchQuery && (
                  <p className="mt-1 text-xs text-gray-500">
                    Cadastre produtos no painel admin antes de registrar vendas.
                  </p>
                )}
              </div>
            ) : (
              <>
                <div className="px-5 py-2 bg-gray-50 border-b border-gray-100">
                  <p className="text-xs font-semibold uppercase tracking-[0.35em] text-gray-400">
                    {searchQuery ? `${products.length} resultados` : 'Produtos disponíveis'}
                  </p>
                </div>
                <ul className="max-h-80 overflow-y-auto divide-y divide-gray-100">
                  {products.map((product, index) => (
                    <li
                      key={product.id}
                      onClick={() => handleSelect(product)}
                      className={`
                        cursor-pointer px-5 py-4 hover:bg-gray-50 transition-colors
                        ${selectedIndex === index ? 'bg-gray-50' : ''}
                        ${index === products.length - 1 ? 'rounded-b-xl' : ''}
                      `}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900 truncate">{product.name}</div>
                          <div className="mt-1 flex items-center gap-3 text-sm text-gray-500">
                            <span className="font-medium">SKU: {product.sku}</span>
                            {product.base_price && (
                              <span className="font-bold text-gray-900">
                                {new Intl.NumberFormat('pt-BR', {
                                  style: 'currency',
                                  currency: 'BRL'
                                }).format(parseFloat(product.base_price))}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}
      </div>
    </>
  )
}

