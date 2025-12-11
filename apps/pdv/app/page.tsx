'use client'

import { useState, useEffect } from 'react'
import { ActionsHome } from '@/components/pdv/actions-home'
import { CartView } from '@/components/pdv/cart-view'
import { PaymentView } from '@/components/pdv/payment-view'
import { ProductSearch } from '@/components/pdv/product-search'
import { CustomerSearch } from '@/components/pdv/customer-search'
import { useActivePdvCart, useAddItemToPdvCart, useApplyDiscount } from '@/lib/hooks/use-pdv-cart'
import { useProducts, type Product } from '@/lib/hooks/use-products'
import { useSearchCustomers, useCreateCustomer, type Customer } from '@/lib/hooks/use-customers'
import { useAssociateCustomer } from '@/lib/hooks/use-pdv-cart'
import toast from 'react-hot-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Percent } from 'lucide-react'
import { Button } from '@white-label/ui'
import { Input } from '@/components/ui/input'

type View = 'home' | 'cart' | 'payment'
type Action = 'search-products' | 'select-customer' | 'apply-discount' | 'create-product' | 'add-note' | 'add-shipping'

export default function PDVPage() {
  const [currentView, setCurrentView] = useState<View>('home')
  const [currentAction, setCurrentAction] = useState<Action | null>(null)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [discountModalOpen, setDiscountModalOpen] = useState(false)
  const [discountCode, setDiscountCode] = useState('')
  const [discountAmount, setDiscountAmount] = useState<number | null>(null)

  const { data: activeCart, refetch: refetchActiveCart } = useActivePdvCart()
  const addItem = useAddItemToPdvCart()
  const associateCustomer = useAssociateCustomer()
  const applyDiscount = useApplyDiscount()

  const handleSelectAction = (action: Action) => {
    setCurrentAction(action)

    switch (action) {
      case 'search-products':
        // Se já tem carrinho, mostrar carrinho, senão criar e mostrar
        if (activeCart) {
          setCurrentView('cart')
        } else {
          // Criar carrinho vazio e mostrar
          setCurrentView('cart')
        }
        break
      case 'select-customer':
        // Abrir modal de seleção de cliente
        setCurrentAction('select-customer')
        break
      case 'apply-discount':
        if (activeCart) {
          setDiscountModalOpen(true)
        } else {
          toast.error('Adicione produtos ao carrinho primeiro')
        }
        break
      default:
        toast('Funcionalidade em desenvolvimento')
    }
  }

  const handleProductSelect = async (product: Product) => {
    // Se não tem carrinho, criar automaticamente ao adicionar produto
    addItem.mutate(
      {
        cart_id: activeCart?.id || undefined,
        product_id: product.id,
        quantity: 1,
        discount: 0
      },
      {
        onSuccess: () => {
          toast.success('Produto adicionado ao carrinho')
          refetchActiveCart()
          setCurrentView('cart')
        },
        onError: (error: any) => {
          toast.error(error.response?.data?.error || 'Erro ao adicionar produto')
        }
      }
    )
  }

  const handleCustomerSelect = (customer: Customer | null) => {
    setSelectedCustomer(customer)

    if (customer && activeCart?.id) {
      associateCustomer.mutate(
        {
          cart_id: activeCart.id,
          customer_id: customer.id
        },
        {
          onSuccess: () => {
            toast.success('Cliente associado ao carrinho')
            refetchActiveCart()
          },
          onError: (error: any) => {
            toast.error(error.response?.data?.error || 'Erro ao associar cliente')
          }
        }
      )
    }
  }

  const handleGoToPayment = () => {
    if (!activeCart || activeCart.items.length === 0) {
      toast.error('Adicione produtos ao carrinho primeiro')
      return
    }
    setCurrentView('payment')
  }

  const handlePaymentComplete = (orderId: string) => {
    setOrderId(orderId)
    toast.success('Venda registrada com sucesso!')
    // Voltar para home após alguns segundos
    setTimeout(() => {
      setCurrentView('home')
      setSelectedCustomer(null)
      setOrderId(null)
      refetchActiveCart()
    }, 3000)
  }

  // Se tem carrinho com itens, mostrar carrinho por padrão (usando useEffect para evitar render loop)
  useEffect(() => {
    if (currentView === 'home' && activeCart && activeCart.items.length > 0) {
      setCurrentView('cart')
    }
  }, [activeCart, currentView])

  return (
    <div className="w-full">
      {/* Modal de Busca de Produtos */}
      {currentAction === 'search-products' && (
        <Dialog open={true} onOpenChange={(open) => !open && setCurrentAction(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Buscar Produtos</DialogTitle>
            </DialogHeader>
            <ProductSearch onSelect={handleProductSelect} />
          </DialogContent>
        </Dialog>
      )}

      {/* Modal de Seleção de Cliente */}
      {currentAction === 'select-customer' && (
        <Dialog open={true} onOpenChange={(open) => !open && setCurrentAction(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Selecionar Cliente</DialogTitle>
            </DialogHeader>
            <CustomerSearch onSelect={handleCustomerSelect} selectedCustomer={selectedCustomer} />
          </DialogContent>
        </Dialog>
      )}

      {/* Modal de Desconto */}
      <Dialog open={discountModalOpen} onOpenChange={setDiscountModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aplicar Desconto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cupom ou valor (R$)
              </label>
              <Input
                type="text"
                placeholder="Cupom ou valor (R$)"
                value={discountCode}
                onChange={(e) => {
                  const value = e.target.value
                  setDiscountCode(value)
                  const numericValue = value.replace(/[^\d,.]/g, '').replace(',', '.')
                  if (numericValue && !isNaN(parseFloat(numericValue))) {
                    setDiscountAmount(Math.round(parseFloat(numericValue) * 100))
                  } else {
                    setDiscountAmount(null)
                  }
                }}
              />
            </div>
            <Button
              onClick={async () => {
                if (!activeCart?.id) {
                  toast.error('Carrinho não encontrado')
                  return
                }

                try {
                  await applyDiscount.mutateAsync({
                    cart_id: activeCart.id,
                    coupon_code: discountCode || null,
                    discount_amount: discountAmount ?? undefined
                  })
                  
                  toast.success('Desconto aplicado')
                  setDiscountModalOpen(false)
                  setDiscountCode('')
                  setDiscountAmount(null)
                  refetchActiveCart()
                } catch (error: any) {
                  toast.error(error.response?.data?.error || 'Erro ao aplicar desconto')
                }
              }}
              className="w-full"
              disabled={applyDiscount.isPending}
            >
              <Percent className="h-4 w-4 mr-2" />
              {applyDiscount.isPending ? 'Aplicando...' : 'Aplicar Desconto'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Renderizar view atual */}
      {currentView === 'home' && <ActionsHome onSelectAction={handleSelectAction} />}
      {currentView === 'cart' && (
        <CartView
          onGoToPayment={handleGoToPayment}
          onSelectCustomer={() => setCurrentAction('select-customer')}
        />
      )}
      {currentView === 'payment' && (
        <PaymentView onBack={() => setCurrentView('cart')} onComplete={handlePaymentComplete} />
      )}
    </div>
  )
}
