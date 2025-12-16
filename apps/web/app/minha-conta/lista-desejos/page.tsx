'use client'

import { useFavorites, useRemoveFavorite } from '@/lib/hooks/use-favorites'
import { Button } from '@/components/ui/button'
import { Heart, ShoppingBag, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useCartStore } from '@/lib/store/useCartStore'
import { useState } from 'react'
import { AccountNavMenu } from '@/components/account/AccountNavMenu'
import { AccountBreadcrumb } from '@/components/account/AccountBreadcrumb'
import toast from 'react-hot-toast'

export default function ListaDesejosPage() {
  const { data: favoritesData, isLoading } = useFavorites()
  const removeFavorite = useRemoveFavorite()
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
      category: favorite.product.category || ''
    }, null)
    toast.success('Produto adicionado ao carrinho!', {
      icon: '🛒',
      duration: 3000,
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="py-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row gap-6 pt-16 lg:pt-0">
              <AccountNavMenu />
              <div className="flex-1">
                <div className="flex justify-center mb-6">
                  <AccountBreadcrumb
                    items={[
                      { label: 'Home', href: '/' },
                      { label: 'Área do Cliente', href: '/minha-conta' },
                      { label: 'Lista de Desejos' },
                    ]}
                  />
                </div>
                <p>Carregando...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-start gap-6 pt-16 lg:pt-0">
            <AccountNavMenu />

            <div className="flex-1">
              <div className="flex justify-center mb-6">
                <AccountBreadcrumb
                  items={[
                    { label: 'Home', href: '/' },
                    { label: 'Área do Cliente', href: '/minha-conta' },
                    { label: 'Lista de Desejos' },
                  ]}
                />
              </div>

              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8">
                <div className="mb-6">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">Lista de Desejos</h1>
                  <p className="text-gray-600">
                    {count > 0
                      ? `${count} ${count === 1 ? 'produto favoritado' : 'produtos favoritados'}`
                      : 'Nenhum produto favoritado ainda'
                    }
                  </p>
                </div>

                {favorites.length === 0 ? (
                  <div className="text-center py-12">
                    <Heart className="h-24 w-24 text-gray-400 mx-auto mb-6 opacity-50" />
                    <h2 className="text-2xl font-bold mb-2">Sua lista está vazia</h2>
                    <p className="text-gray-600 mb-6">
                      Adicione produtos aos seus favoritos para vê-los aqui
                    </p>
                    <Button asChild>
                      <Link href="/">Explorar Produtos</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {favorites.map((favorite) => (
                      <div
                        key={favorite.id}
                        className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
                      >
                        <Link href={`/produto/${favorite.product.slug}`}>
                          <div className="aspect-square relative overflow-hidden bg-gray-100">
                            <img
                              src={favorite.product.main_image || '/placeholder.png'}
                              alt={favorite.product.name}
                              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        </Link>
                        <div className="p-4">
                          <Link href={`/produto/${favorite.product.slug}`}>
                            <h3 className="font-bold text-lg mb-2 line-clamp-2 hover:text-primary transition-colors">
                              {favorite.product.name}
                            </h3>
                          </Link>
                          <p className="text-2xl font-bold mb-4">
                            R$ {parseFloat(favorite.product.base_price || '0').toFixed(2)}
                          </p>
                          <div className="flex gap-2">
                            <Button
                              className="flex-1"
                              onClick={() => handleAddToCart(favorite)}
                            >
                              <ShoppingBag className="h-4 w-4 mr-2" />
                              Adicionar
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="text-red-500 hover:text-red-600 hover:bg-red-50"
                              onClick={() => handleRemove(favorite.product_id, favorite.product.name)}
                              disabled={removingId === favorite.product_id}
                              title="Remover dos favoritos"
                            >
                              {removingId === favorite.product_id ? (
                                <div className="h-4 w-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

