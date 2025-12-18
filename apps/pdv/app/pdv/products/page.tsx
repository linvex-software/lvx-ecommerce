'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Minus, X, ArrowRight, ArrowLeft, Search, Percent } from 'lucide-react'
import { Button } from '@white-label/ui'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { StepProgress } from '@/components/pdv/step-progress'
import { usePDV } from '@/context/pdv-context'
import { useProducts, type Product } from '@/lib/hooks/use-products'
import { useDebounce } from '@/lib/hooks/use-debounce'
import {
  usePdvCart,
  useAddItemToPdvCart,
  useRemoveItemFromPdvCart,
  useUpdateItemQuantity,
  useApplyDiscount
} from '@/lib/hooks/use-pdv-cart'
import { useProducts as useProductsHook } from '@/lib/hooks/use-products'
import toast from 'react-hot-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export default function ProductsStepPage() {
  const router = useRouter()
  const { state, setCart, setCartId, setCurrentStep, createCartIfNotExists } = usePDV()
  const [searchQuery, setSearchQuery] = useState('')
  const [discountModalOpen, setDiscountModalOpen] = useState(false)
  const [discountType, setDiscountType] = useState<'coupon' | 'manual'>('manual')
  const [couponCode, setCouponCode] = useState('')
  const [manualDiscountType, setManualDiscountType] = useState<'percentage' | 'fixed'>('fixed')
  const [manualDiscountValue, setManualDiscountValue] = useState('')

  // Validar requisitos da etapa
  useEffect(() => {
    if (!state.customer) {
      router.push('/pdv/client')
      return
    }
    if (!state.vendorId) {
      router.push('/pdv/vendor')
      return
    }
    // Garantir que carrinho existe
    if (!state.cartId) {
      createCartIfNotExists()
    }
  }, [state.customer, state.vendorId, state.cartId, router, createCartIfNotExists])

  const debouncedQuery = useDebounce(searchQuery, 300)
  const { data: productsData, isLoading: productsLoading } = useProductsHook({
    q: debouncedQuery || undefined,
    status: 'active',
    limit: 50
  })

  // Usar cartId do contexto ao invés de activeCart
  const { data: cartData, refetch: refetchCart } = usePdvCart(state.cartId)
  // Priorizar cartData do hook, mas usar state.cart como fallback
  const activeCart = cartData || state.cart

  const addItem = useAddItemToPdvCart()
  const removeItem = useRemoveItemFromPdvCart()
  const updateQuantity = useUpdateItemQuantity()
  const applyDiscount = useApplyDiscount()

  const products = productsData?.products || []

  // Sincronizar carrinho com contexto (evitar loop infinito)
  useEffect(() => {
    if (cartData) {
      // Atualizar contexto sempre que cartData mudar
      setCart(cartData)
      if (cartData.id !== state.cartId) {
        setCartId(cartData.id)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartData])

  useEffect(() => {
    // Se não tem cliente ou vendedor, voltar para etapas anteriores
    if (!state.customer) {
      router.push('/pdv/client')
      return
    }
    if (!state.vendorId) {
      router.push('/pdv/vendor')
      return
    }
  }, [state.customer, state.vendorId, router])

  const handleProductSelect = async (product: Product) => {
    // Garantir que carrinho existe
    let cartId = state.cartId
    if (!cartId) {
      cartId = await createCartIfNotExists()
      if (!cartId) {
        toast.error('Erro ao criar carrinho. Tente novamente.')
        return
      }
    }

    try {
      const updatedCart = await addItem.mutateAsync({
        cart_id: cartId,
        product_id: product.id,
        variant_id: null,
        quantity: 1,
        discount: 0
      })

      // Atualizar contexto com o carrinho atualizado
      setCart(updatedCart)
      setCartId(updatedCart.id)

      // Refetch para garantir sincronização
      if (refetchCart) {
        refetchCart()
      }

      toast.success('Produto adicionado ao carrinho')
    } catch (error: any) {
      console.error('Erro ao adicionar produto:', error.response?.data || error)
      toast.error(error.response?.data?.error || 'Erro ao adicionar produto')
    }
  }

  const handleRemoveItem = (productId: string, variantId?: string | null) => {
    if (!state.cartId) return

    removeItem.mutate(
      {
        cart_id: state.cartId,
        product_id: productId,
        variant_id: variantId ?? null
      },
      {
        onSuccess: (updatedCart) => {
          // Atualizar contexto
          setCart(updatedCart)
          setCartId(updatedCart.id)
          toast.success('Item removido do carrinho')
        },
        onError: (error: any) => {
          console.error('Erro ao remover item:', error.response?.data || error)
          toast.error(error.response?.data?.error || 'Erro ao remover item')
        }
      }
    )
  }

  const handleQuantityChange = (productId: string, variantId: string | null, newQuantity: number) => {
    if (!state.cartId || newQuantity < 1) return

    updateQuantity.mutate(
      {
        cart_id: state.cartId,
        product_id: productId,
        variant_id: variantId ?? null,
        quantity: newQuantity
      },
      {
        onSuccess: (updatedCart) => {
          // Atualizar contexto
          setCart(updatedCart)
          setCartId(updatedCart.id)
        },
        onError: (error: any) => {
          console.error('Erro ao atualizar quantidade:', error.response?.data || error)
          toast.error(error.response?.data?.error || 'Erro ao atualizar quantidade')
        }
      }
    )
  }

  const handleApplyDiscount = async () => {
    if (!state.cartId) {
      toast.error('Carrinho não encontrado')
      return
    }

    try {
      let requestData: {
        cart_id: string
        coupon_code?: string | null
        discount_amount?: number
      } = {
        cart_id: state.cartId
      }

      if (discountType === 'coupon') {
        // Aplicar cupom
        if (!couponCode.trim()) {
          toast.error('Digite um código de cupom')
          return
        }
        requestData.coupon_code = couponCode.trim().toUpperCase()
      } else {
        // Desconto manual
        if (!manualDiscountValue.trim()) {
          toast.error('Digite um valor de desconto')
          return
        }

        const discountValue = parseFloat(manualDiscountValue.replace(',', '.'))
        if (isNaN(discountValue) || discountValue <= 0) {
          toast.error('Valor de desconto inválido')
          return
        }

        if (manualDiscountType === 'percentage') {
          // Calcular desconto percentual
          if (discountValue > 100) {
            toast.error('Percentual não pode ser maior que 100%')
            return
          }
          const cartSubtotal = subtotal
          const discountAmount = Math.round((cartSubtotal * discountValue) / 100)
          requestData.discount_amount = discountAmount
        } else {
          // Desconto fixo em reais -> converter para centavos
          requestData.discount_amount = Math.round(discountValue * 100)
        }
      }

      const updatedCart = await applyDiscount.mutateAsync(requestData)

      // Atualizar contexto
      setCart(updatedCart)
      setCartId(updatedCart.id)

      toast.success('Desconto aplicado com sucesso!')
      setDiscountModalOpen(false)
      setCouponCode('')
      setManualDiscountValue('')
    } catch (error: any) {
      console.error('Erro ao aplicar desconto:', error.response?.data || error)
      toast.error(error.response?.data?.error || 'Erro ao aplicar desconto')
    }
  }

  const handleGoToPayment = () => {
    if (!activeCart || activeCart.items.length === 0) {
      toast.error('Adicione produtos ao carrinho primeiro')
      return
    }
    if (!state.cartId) {
      toast.error('Carrinho não encontrado')
      return
    }
    if (!state.vendorId) {
      toast.error('Selecione um vendedor primeiro')
      router.push('/pdv/vendor')
      return
    }
    // Atualizar etapa no contexto e navegar
    setCurrentStep('payment')
    // Usar setTimeout para garantir que o estado seja atualizado antes da navegação
    setTimeout(() => {
      router.push('/pdv/payment')
    }, 0)
  }

  const formatCurrency = (cents: number | string) => {
    const value = typeof cents === 'string' ? parseFloat(cents) : cents
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value / 100)
  }

  const subtotal = activeCart
    ? activeCart.items.reduce((sum, item) => {
        const itemTotal = item.price * item.quantity
        const itemDiscount = item.discount ?? 0
        return sum + itemTotal - itemDiscount
      }, 0)
    : 0

  const discount = activeCart ? parseFloat(activeCart.discount_amount) || 0 : 0
  const total = Math.max(0, subtotal - discount)

  return (
    <div className="w-full max-w-7xl mx-auto">
      <StepProgress currentStep="products" />

      <div className="p-4 md:p-6">
        {/* Header Info */}
        <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          {state.customer && (
            <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 shadow-sm">
              <CardContent className="p-3">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Cliente</p>
                <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{state.customer.name}</p>
              </CardContent>
            </Card>
          )}
          {state.vendorName && (
            <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 shadow-sm">
              <CardContent className="p-3">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Vendedor</p>
                <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{state.vendorName}</p>
              </CardContent>
            </Card>
          )}
          <Card className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm">
            <CardContent className="p-3">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Origem</p>
              <p className="font-semibold text-gray-900 dark:text-white text-sm capitalize">{state.origin}</p>
            </CardContent>
          </Card>
        </div>

        {/* Layout: Busca + Carrinho */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {/* Busca de Produtos */}
          <div className="space-y-4">
            <Card className="shadow-sm border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800">
              <CardContent className="p-4 md:p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Buscar Produtos</h2>
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Buscar por nome ou SKU..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-12"
                  />
                </div>

                {/* Lista de Produtos */}
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {productsLoading ? (
                    <div className="text-center py-8 text-gray-500">Carregando produtos...</div>
                  ) : products.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      {searchQuery ? 'Nenhum produto encontrado' : 'Digite para buscar produtos'}
                    </div>
                  ) : (
                    products.map((product) => (
                      <div
                        key={product.id}
                        className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-300 dark:hover:border-gray-600 transition-colors bg-white dark:bg-gray-800 shadow-sm hover:shadow-md"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white truncate">{product.name}</p>
                          <div className="flex items-center gap-3 mt-1 text-sm text-gray-600 dark:text-gray-400">
                            <span>SKU: {product.sku}</span>
                            {product.base_price && (
                              <span className="font-bold text-gray-900 dark:text-white">
                                {formatCurrency(parseFloat(product.base_price) * 100)}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          onClick={() => handleProductSelect(product)}
                          size="sm"
                          className="ml-3"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Adicionar
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Carrinho */}
          <div className="space-y-4">
            <Card className="sticky top-4 shadow-lg border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Carrinho</h2>
                  {activeCart && activeCart.items.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDiscountModalOpen(true)}
                    >
                      <Percent className="h-4 w-4 mr-1" />
                      Desconto
                    </Button>
                  )}
                </div>

                {!activeCart || activeCart.items.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <p className="mb-2">Carrinho vazio</p>
                    <p className="text-sm">Adicione produtos para começar</p>
                  </div>
                ) : (
                  <>
                    {/* Itens do Carrinho */}
                    <div className="space-y-3 max-h-[400px] overflow-y-auto mb-4">
                        {activeCart.items.map((item, index) => {
                        // Buscar produto para mostrar nome
                        const product = products.find((p) => p.id === item.product_id)
                        return (
                          <div
                            key={index}
                            className="flex items-start gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 shadow-sm"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 dark:text-white text-sm">
                                {product?.name || `Produto ${item.product_id.slice(0, 8)}`}
                              </p>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                {formatCurrency(item.price)} cada
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700">
                                <button
                                  onClick={() =>
                                    handleQuantityChange(
                                      item.product_id,
                                      item.variant_id ?? null,
                                      item.quantity - 1
                                    )
                                  }
                                  className="p-1.5 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 disabled:opacity-50"
                                  disabled={item.quantity <= 1}
                                >
                                  <Minus className="h-3 w-3" />
                                </button>
                                <span className="w-8 text-center text-sm font-medium text-gray-900 dark:text-white">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() =>
                                    handleQuantityChange(
                                      item.product_id,
                                      item.variant_id ?? null,
                                      item.quantity + 1
                                    )
                                  }
                                  className="p-1.5 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
                                >
                                  <Plus className="h-3 w-3" />
                                </button>
                              </div>
                              <button
                                onClick={() =>
                                  handleRemoveItem(item.product_id, item.variant_id ?? null)
                                }
                                className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Resumo */}
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                        <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(subtotal)}</span>
                      </div>
                      {discount > 0 && (
                        <div className="flex justify-between text-sm text-red-600 dark:text-red-400">
                          <span>Desconto</span>
                          <span>-{formatCurrency(discount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-lg font-bold border-t border-gray-200 dark:border-gray-700 pt-2">
                        <span className="text-gray-900 dark:text-white">Total</span>
                        <span className="text-gray-900 dark:text-white">{formatCurrency(total)}</span>
                      </div>
                    </div>

                    <Button
                      onClick={handleGoToPayment}
                      className="w-full h-12 mt-4 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white text-base font-semibold shadow-lg hover:shadow-xl transition-all"
                      size="lg"
                    >
                      Ir para Pagamento
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Botão Voltar */}
        <div className="mt-4">
          <Button
            variant="outline"
            onClick={() => router.push('/pdv/vendor')}
            className="w-full md:w-auto"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </div>
      </div>

      {/* Modal de Desconto */}
      <Dialog open={discountModalOpen} onOpenChange={setDiscountModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Aplicar Desconto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Abas: Cupom ou Desconto Manual */}
            <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <button
                onClick={() => setDiscountType('manual')}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  discountType === 'manual'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Desconto Manual
              </button>
              <button
                onClick={() => setDiscountType('coupon')}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  discountType === 'coupon'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Cupom
              </button>
            </div>

            {/* Conteúdo conforme o tipo selecionado */}
            {discountType === 'coupon' ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Código do Cupom
                  </label>
                  <Input
                    type="text"
                    placeholder="Ex: DESCONTO10"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="uppercase"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Digite o código promocional do cupom
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Tipo de desconto: % ou R$ */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setManualDiscountType('fixed')}
                    className={`flex-1 py-2 px-3 border rounded-md text-sm font-medium transition-colors ${
                      manualDiscountType === 'fixed'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                        : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
                    }`}
                  >
                    Valor Fixo (R$)
                  </button>
                  <button
                    onClick={() => setManualDiscountType('percentage')}
                    className={`flex-1 py-2 px-3 border rounded-md text-sm font-medium transition-colors ${
                      manualDiscountType === 'percentage'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                        : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
                    }`}
                  >
                    Percentual (%)
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {manualDiscountType === 'percentage' ? 'Percentual de Desconto' : 'Valor do Desconto'}
                  </label>
                  <Input
                    type="text"
                    placeholder={manualDiscountType === 'percentage' ? 'Ex: 10' : 'Ex: 50.00'}
                    value={manualDiscountValue}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^\d,.]/g, '')
                      setManualDiscountValue(value)
                    }}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {manualDiscountType === 'percentage' 
                      ? 'Digite o percentual de desconto (ex: 10 para 10%)'
                      : 'Digite o valor em reais (ex: 50.00)'}
                  </p>
                </div>
              </div>
            )}

            <Button 
              onClick={handleApplyDiscount} 
              className="w-full" 
              disabled={applyDiscount.isPending}
            >
              <Percent className="h-4 w-4 mr-2" />
              {applyDiscount.isPending ? 'Aplicando...' : 'Aplicar Desconto'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

