'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Minus, X, ShoppingBag, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCartStore } from '@/lib/store/useCartStore'
import Navbar from '@/components/Navbar'
import Link from 'next/link'

export default function CarrinhoPage() {
  const { items, removeItem, updateQuantity, openCart } = useCartStore()
  const router = useRouter()

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }, [items])

  const total = subtotal
  const totalItems = useMemo(() => {
    return items.reduce((sum, item) => sum + item.quantity, 0)
  }, [items])

  const handleQuantityChange = (id: number | string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(id)
      return
    }
    updateQuantity(id, newQuantity)
  }

  const handleCheckout = () => {
    router.push('/checkout')
  }

  const handleContinueShopping = () => {
    router.push('/')
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar cartCount={totalItems} onCartClick={openCart} />
        <main className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto text-center">
            <ShoppingBag className="h-24 w-24 mx-auto text-muted-foreground mb-6" />
            <h1 className="text-3xl font-bold mb-4">Seu carrinho está vazio</h1>
            <p className="text-muted-foreground mb-8">
              Adicione produtos ao carrinho para começar suas compras
            </p>
            <Button asChild size="lg">
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Continuar Comprando
              </Link>
            </Button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar cartCount={totalItems} onCartClick={openCart} />
      <main className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Carrinho de Compras</h1>
            <p className="text-muted-foreground">
              {totalItems} {totalItems === 1 ? 'item' : 'itens'} no seu carrinho
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row gap-4 p-4 border border-border rounded-lg bg-card"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full sm:w-32 h-32 object-cover bg-secondary rounded-md"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg mb-1 line-clamp-2">{item.name}</h3>
                        <p className="text-sm text-muted-foreground mb-3">{item.category}</p>
                        <p className="text-lg font-bold">R$ {item.price.toFixed(2)}</p>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={() => removeItem(item.id)}
                        title="Remover item"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center border border-border rounded-md">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10"
                          onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="px-4 text-base font-medium min-w-[3rem] text-center">
                          {item.quantity}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10"
                          onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Subtotal</p>
                        <p className="text-xl font-bold">R$ {(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="lg:col-span-1">
              <div className="sticky top-24 bg-card border border-border rounded-lg p-6 space-y-6">
                <h2 className="text-2xl font-bold">Resumo do Pedido</h2>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">R$ {subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Frete</span>
                    <span className="font-medium">Grátis</span>
                  </div>
                </div>

                <div className="border-t border-border pt-4">
                  <div className="flex justify-between text-lg font-bold mb-6">
                    <span>Total</span>
                    <span>R$ {total.toFixed(2)}</span>
                  </div>

                  <Button
                    className="w-full bg-foreground text-background hover:bg-accent"
                    size="lg"
                    onClick={handleCheckout}
                  >
                    Finalizar Compra
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full mt-3"
                    onClick={handleContinueShopping}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Continuar Comprando
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

