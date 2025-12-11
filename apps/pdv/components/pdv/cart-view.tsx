'use client'

import { useState, useEffect } from 'react'
import { Plus, Minus, X, ArrowRight } from 'lucide-react'
import { Button } from '@white-label/ui'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { useActivePdvCart, useRemoveItemFromPdvCart, useUpdateItemQuantity, useUpdateCartOrigin, useUpdateCartSeller } from '@/lib/hooks/use-pdv-cart'
import { useSellers } from '@/lib/hooks/use-users'
import { type Customer } from '@/lib/hooks/use-customers'
import { useCustomerById } from '@/lib/hooks/use-customer-by-id'
import { maskCPF, maskPhone } from '@/lib/utils/masks'
import { useProducts, type Product } from '@/lib/hooks/use-products'
import toast from 'react-hot-toast'

interface CartViewProps {
  onGoToPayment: () => void
  onSelectCustomer: () => void
  onBackToHome: () => void
}

export function CartView({ onGoToPayment, onSelectCustomer, onBackToHome }: CartViewProps) {
  const { data: cart, isLoading: cartLoading } = useActivePdvCart()
  const { data: sellersData } = useSellers()
  const { data: productsData } = useProducts({ status: 'active', limit: 100 })
  const removeItem = useRemoveItemFromPdvCart()
  const updateQuantity = useUpdateItemQuantity()
  const updateOrigin = useUpdateCartOrigin()
  const updateSeller = useUpdateCartSeller()

  const [productCache, setProductCache] = useState<Record<string, Product>>({})

  const sellers = sellersData?.users || []
  const { data: customer } = useCustomerById(cart?.customer_id || null)

  // Cache de produtos
  useEffect(() => {
    if (productsData?.products) {
      const cache: Record<string, Product> = {}
      productsData.products.forEach((product) => {
        cache[product.id] = product
      })
      setProductCache(cache)
    }
  }, [productsData])

  const formatCurrency = (cents: number | string) => {
    const value = typeof cents === 'string' ? parseFloat(cents) : cents
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value / 100)
  }

  const getProductName = (productId: string) => {
    return productCache[productId]?.name || `Produto ${productId.slice(0, 8)}`
  }

  const getProductImage = (productId: string) => {
    return productCache[productId]?.images?.[0] || null
  }

  const handleRemoveItem = (productId: string, variantId?: string | null) => {
    if (!cart?.id) return

    removeItem.mutate(
      {
        cart_id: cart.id,
        product_id: productId,
        variant_id: variantId ?? null
      },
      {
        onSuccess: () => {
          toast.success('Item removido do carrinho')
        },
        onError: (error: any) => {
          toast.error(error.response?.data?.error || 'Erro ao remover item')
        }
      }
    )
  }

  const handleQuantityChange = (productId: string, variantId: string | null, newQuantity: number) => {
    if (!cart?.id || newQuantity < 1) return

    updateQuantity.mutate(
      {
        cart_id: cart.id,
        product_id: productId,
        variant_id: variantId ?? null,
        quantity: newQuantity
      },
      {
        onError: (error: any) => {
          toast.error(error.response?.data?.error || 'Erro ao atualizar quantidade')
        }
      }
    )
  }

  const handleOriginChange = (origin: string) => {
    if (!cart?.id) return

    updateOrigin.mutate(
      {
        cart_id: cart.id,
        origin
      },
      {
        onError: (error: any) => {
          toast.error(error.response?.data?.error || 'Erro ao atualizar origem')
        }
      }
    )
  }

  const handleSellerChange = (sellerId: string) => {
    if (!cart?.id) return

    updateSeller.mutate(
      {
        cart_id: cart.id,
        seller_user_id: sellerId
      },
      {
        onError: (error: any) => {
          toast.error(error.response?.data?.error || 'Erro ao atualizar vendedor')
        }
      }
    )
  }

  if (cartLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Carregando carrinho...</div>
      </div>
    )
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <p className="text-lg mb-2">Carrinho vazio</p>
        <p className="text-sm">Adicione produtos para começar uma venda</p>
      </div>
    )
  }

  const subtotal = cart.items.reduce((sum, item) => {
    const itemTotal = item.price * item.quantity
    const itemDiscount = item.discount ?? 0
    return sum + itemTotal - itemDiscount
  }, 0)

  const discount = parseFloat(cart.discount_amount) || 0
  const total = Math.max(0, subtotal - discount)

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Cliente */}
      <Card>
        <CardContent className="p-4">
          {customer ? (
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={undefined} />
                <AvatarFallback>
                  {customer.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{customer.name}</p>
                {customer.phone && (
                  <p className="text-sm text-gray-600">{maskPhone(customer.phone)}</p>
                )}
                {customer.cpf && (
                  <p className="text-sm text-gray-500">CPF: {maskCPF(customer.cpf)}</p>
                )}
              </div>
            </div>
          ) : (
            <Button variant="outline" onClick={onSelectCustomer} className="w-full">
              Selecionar cliente
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Vendedor e Origem */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Vendedor <span className="text-red-500">*</span>
          </label>
          <Select
            value={cart.seller_user_id || ''}
            onChange={(e) => {
              if (e.target.value) {
                handleSellerChange(e.target.value)
              }
            }}
            required
          >
            <option value="">Selecione um vendedor</option>
            {sellers.map((seller) => (
              <option key={seller.id} value={seller.id}>
                {seller.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Origem</label>
          <Select value={cart.origin || 'pdv'} onChange={(e) => handleOriginChange(e.target.value)}>
            <option value="pdv">PDV / Balcão</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="instagram">Instagram</option>
            <option value="facebook">Facebook</option>
            <option value="telefone">Telefone</option>
            <option value="online">Online</option>
          </Select>
        </div>
      </div>

      {/* Itens do Carrinho */}
      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-gray-200">
            {cart.items.map((item, index) => {
              const productImage = getProductImage(item.product_id)
              return (
                <div key={index} className="p-4 flex items-start gap-4">
                  {productImage ? (
                    <img
                      src={productImage}
                      alt={getProductName(item.product_id)}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center">
                      <span className="text-xs text-gray-400">Sem foto</span>
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {getProductName(item.product_id)}
                    </p>
                    <p className="text-sm text-gray-600">{formatCurrency(item.price)} cada</p>
                    {item.discount && item.discount > 0 && (
                      <p className="text-xs text-green-600">
                        Desconto: {formatCurrency(item.discount)}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 border border-gray-300 rounded-lg">
                      <button
                        onClick={() =>
                          handleQuantityChange(item.product_id, item.variant_id ?? null, item.quantity - 1)
                        }
                        className="p-2 hover:bg-gray-50 transition-colors"
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <button
                        onClick={() =>
                          handleQuantityChange(item.product_id, item.variant_id ?? null, item.quantity + 1)
                        }
                        className="p-2 hover:bg-gray-50 transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="text-right min-w-[80px]">
                      <p className="font-semibold text-gray-900">
                        {formatCurrency(item.price * item.quantity - (item.discount || 0))}
                      </p>
                    </div>

                    <button
                      onClick={() => handleRemoveItem(item.product_id, item.variant_id ?? null)}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Resumo */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-medium">{formatCurrency(subtotal)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-sm text-red-600">
              <span>Desconto</span>
              <span>-{formatCurrency(discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Total de itens</span>
            <span className="font-medium">{cart.items.length}</span>
          </div>
          <div className="border-t border-gray-200 pt-4 flex justify-between text-lg font-bold">
            <span>Total</span>
            <span className="text-gray-900">{formatCurrency(total)}</span>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => {
                if (!cart.seller_user_id) {
                  toast.error('Selecione um vendedor antes de finalizar')
                  return
                }
                onGoToPayment()
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-base font-semibold"
              size="lg"
              disabled={!cart.seller_user_id}
            >
              Finalizar venda
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              onClick={onBackToHome}
              variant="outline"
              className="w-full"
            >
              Voltar e adicionar mais produtos
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

