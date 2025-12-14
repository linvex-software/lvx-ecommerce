'use client'

import { Heart } from 'lucide-react'
import { useCheckFavorite, useAddFavorite, useRemoveFavorite } from '@/lib/hooks/use-favorites'
import { useAuthStore } from '@/lib/store/useAuthStore'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface FavoriteButtonProps {
  productId: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

export function FavoriteButton({ 
  productId, 
  className,
  size = 'md',
  showLabel = false 
}: FavoriteButtonProps) {
  const { accessToken, customer } = useAuthStore()
  const isAuthenticated = !!(accessToken && customer)
  const router = useRouter()
  const [localLoading, setLocalLoading] = useState(false)

  const { data: checkData, isLoading: isLoadingCheck } = useCheckFavorite(
    isAuthenticated ? productId : null
  )
  const addFavorite = useAddFavorite()
  const removeFavorite = useRemoveFavorite()

  const isFavorite = checkData?.isFavorite ?? false
  const isLoading = localLoading || addFavorite.isPending || removeFavorite.isPending || isLoadingCheck

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  }

  // Handler inline direto - sem abstrações
  const handleFavoriteClick = async () => {
    if (!isAuthenticated) {
      router.push('/login?redirect=' + encodeURIComponent(window.location.pathname))
      return
    }

    if (!productId) {
      console.error('[FavoriteButton] ProductId não fornecido')
      return
    }

    setLocalLoading(true)
    try {
      if (isFavorite) {
        await removeFavorite.mutateAsync(productId)
      } else {
        await addFavorite.mutateAsync(productId)
      }
    } catch (error: any) {
      console.error('[FavoriteButton] Erro:', error)
      // Mostrar erro apenas se for algo crítico
      if (error?.status !== 401) {
        alert(`Erro: ${error?.payload?.error || error?.message || 'Erro desconhecido'}`)
      }
    } finally {
      setLocalLoading(false)
    }
  }

  // Se não estiver autenticado e showLabel for false, mostrar botão que redireciona
  if (!isAuthenticated && !showLabel) {
    return (
      <button
        type="button"
        className={cn(
          'p-2 rounded-md hover:bg-gray-100 transition-colors',
          'flex items-center justify-center cursor-pointer',
          'relative z-[99999]',
          className
        )}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          router.push('/login?redirect=' + encodeURIComponent(window.location.pathname))
        }}
        title="Faça login para favoritar produtos"
      >
        <Heart className={cn(iconSizes[size], 'text-gray-600')} />
      </button>
    )
  }

  return (
    <button
      type="button"
      className={cn(
        'transition-colors',
        'flex items-center justify-center cursor-pointer',
        'relative z-[99999]',
        'disabled:opacity-50 disabled:cursor-wait',
        isFavorite 
          ? 'text-red-500 hover:text-red-600 hover:bg-red-50' 
          : 'text-gray-600 hover:text-red-500 hover:bg-gray-100',
        className || 'p-2 rounded-md'
      )}
      disabled={isLoading}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        handleFavoriteClick()
      }}
      onMouseDown={(e) => {
        e.preventDefault()
        e.stopPropagation()
      }}
      title={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
    >
      {isLoading ? (
        <div className={cn(iconSizes[size], 'border-2 border-current border-t-transparent rounded-full animate-spin')} />
      ) : (
        <Heart 
          className={cn(
            iconSizes[size],
            isFavorite && 'fill-current'
          )} 
        />
      )}
      {showLabel && !isLoading && (
        <span className="text-sm ml-2">
          {isFavorite ? 'Remover' : 'Favoritar'}
        </span>
      )}
    </button>
  )
}
