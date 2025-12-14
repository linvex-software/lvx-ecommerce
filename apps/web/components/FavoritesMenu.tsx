'use client'

import { X, Heart, ArrowLeft, ShoppingBag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useFavorites, useRemoveFavorite } from '@/lib/hooks/use-favorites'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useFavoritesStore } from '@/lib/store/useFavoritesStore'
import { useCartStore } from '@/lib/store/useCartStore'
import { useState } from 'react'
import { useAuthStore } from '@/lib/store/useAuthStore'
import toast from 'react-hot-toast'

const FavoritesMenu = () => {
  const { isOpen, closeFavorites } = useFavoritesStore()
  const { accessToken, customer } = useAuthStore()
  const isAuthenticated = !!(accessToken && customer)

  const { data: favoritesData, isLoading } = useFavorites()
  const removeFavorite = useRemoveFavorite()
  const router = useRouter()
  const { addItem } = useCartStore()
  const [removingId, setRemovingId] = useState<string | null>(null)

  const favorites = favoritesData?.favorites || []
  const count = favoritesData?.count || 0

  const handleRemove = async (productId: string, productName: string) => {
    setRemovingId(productId)
    try {
      await removeFavorite.mutateAsync(productId)
      toast.success('Produto removido dos favoritos', {
        icon: '❤️',
        duration: 3000,
      })
    } catch (error) {
      toast.error('Erro ao remover produto dos favoritos', {
        duration: 3000,
      })
    } finally {
      setRemovingId(null)
    }
  }

  const handleAddToCart = (favorite: any) => {
    addItem({
      id: favorite.product_id,
      name: favorite.product.name,
      price: parseFloat(favorite.product.base_price),
      image: favorite.product.main_image || '/placeholder.png',
      quantity: 1,
      variant_id: null
    })
    toast.success('Produto adicionado ao carrinho!', {
      icon: '🛒',
      duration: 3000,
    })
    closeFavorites()
  }

  const handleViewList = () => {
    closeFavorites()
    router.push('/minha-conta/lista-desejos')
  }

  // Não renderizar se não estiver autenticado ou se o menu não estiver aberto
  if (!isAuthenticated || !isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50 flex justify-end"
        onClick={closeFavorites}
      >
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="bg-background w-full max-w-md h-full shadow-2xl flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={closeFavorites} title="Fechar">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h2 className="text-2xl font-bold">Favoritos</h2>
            </div>
            <Button variant="ghost" size="icon" onClick={closeFavorites}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex-1 overflow-auto p-6">
            {isLoading ? (
              <p className="text-center text-muted-foreground mt-8">Carregando...</p>
            ) : favorites.length === 0 ? (
              <div className="text-center mt-8">
                <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground mb-2">Nenhum favorito ainda</p>
                <p className="text-sm text-muted-foreground">
                  Adicione produtos aos seus favoritos
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                  {favorites.map((favorite, index) => (
                    <motion.div
                      key={favorite.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 20, scale: 0.95 }}
                      transition={{ duration: 0.15, delay: index * 0.02 }}
                      className="flex gap-4 border-b border-border pb-4"
                    >
                      <Link
                        href={`/produto/${favorite.product.slug}`}
                        onClick={closeFavorites}
                        className="flex-shrink-0"
                      >
                        <img
                          src={favorite.product.main_image || '/placeholder.png'}
                          alt={favorite.product.name}
                          className="w-20 h-20 object-cover bg-secondary rounded-md"
                        />
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/produto/${favorite.product.slug}`}
                          onClick={closeFavorites}
                        >
                          <h3 className="font-bold text-sm line-clamp-2 hover:text-primary transition-colors">
                            {favorite.product.name}
                          </h3>
                        </Link>
                        <p className="font-bold mt-2 text-sm">
                          R$ {parseFloat(favorite.product.base_price || '0').toFixed(2)}
                        </p>
                        <div className="flex gap-2 mt-3">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs"
                            onClick={() => handleAddToCart(favorite)}
                          >
                            <ShoppingBag className="h-3 w-3 mr-1" />
                            Adicionar
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-red-500 hover:text-red-600"
                            onClick={() => handleRemove(favorite.product_id, favorite.product.name)}
                            disabled={removingId === favorite.product_id}
                          >
                            {removingId === favorite.product_id ? 'Removendo...' : 'Remover'}
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

          {count > 0 && (
            <div className="p-6 border-t border-border space-y-4">
              <div className="flex justify-between text-lg font-bold">
                <span>Total de favoritos</span>
                <span>{count}</span>
              </div>
              <Button
                className="w-full bg-foreground text-background hover:bg-accent"
                size="lg"
                onClick={handleViewList}
              >
                Ver Lista Completa
              </Button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default FavoritesMenu

