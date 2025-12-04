import Link from "next/link";
import { X, Minus, Plus, ShoppingBag } from "lucide-react";
import { useCart } from "../contexts/CartContext";
import { Button } from "../ui/button";
import { cn } from '@/lib/utils';

export function MiniCart() {
  const { items, isOpen, setIsOpen, removeItem, updateQuantity, total, itemCount } = useCart();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          "fixed inset-0 bg-charcoal/50 z-50 transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsOpen(false)}
      />

      {/* Drawer */}
      <div
        className={cn(
          "fixed right-0 top-0 h-full w-full max-w-md bg-background z-50 shadow-2xl transition-transform duration-300 flex flex-col",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <ShoppingBag size={24} />
            <h2 className="font-display text-xl">Sacola ({itemCount})</h2>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-secondary rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-6">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <ShoppingBag size={48} className="text-muted-foreground mb-4" />
              <p className="text-muted-foreground font-body mb-6">Sua sacola está vazia</p>
              <Button onClick={() => setIsOpen(false)} asChild>
                <Link href="/produtos">Continuar Comprando</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {items.map((item) => {
                // Usar slug se disponível, senão usar id
                const productUrl = item.product.slug ? `/produto/${item.product.slug}` : `/produto/${item.product.id}`
                
                return (
                <div
                  key={`${item.product.id}-${item.size}-${item.color}`}
                  className="flex gap-4 animate-fade-in"
                >
                  <Link
                    href={productUrl}
                    onClick={() => setIsOpen(false)}
                    className="w-20 h-24 bg-secondary flex-shrink-0 overflow-hidden"
                  >
                    <img
                      src={item.product.images[0]}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={productUrl}
                      onClick={() => setIsOpen(false)}
                      className="font-body text-sm font-medium hover:text-primary transition-colors line-clamp-2"
                    >
                      {item.product.name}
                    </Link>
                    <p className="text-xs text-muted-foreground mt-1">
                      Tam: {item.size} | Cor: {item.color}
                    </p>
                    <p className="font-body font-semibold mt-2">{formatPrice(item.product.price)}</p>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center border border-border">
                        <button
                          onClick={() =>
                            updateQuantity(item.product.id, item.size, item.color, item.quantity - 1)
                          }
                          className="w-8 h-8 flex items-center justify-center hover:bg-secondary transition-colors"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-10 text-center text-sm font-medium">{item.quantity}</span>
                        <button
                          onClick={() =>
                            updateQuantity(item.product.id, item.size, item.color, item.quantity + 1)
                          }
                          className="w-8 h-8 flex items-center justify-center hover:bg-secondary transition-colors"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(item.product.id, item.size, item.color)}
                        className="text-xs text-muted-foreground hover:text-destructive transition-colors underline"
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-6 border-t border-border bg-secondary/30">
            <div className="flex justify-between items-center mb-4">
              <span className="font-body text-sm">Subtotal</span>
              <span className="font-display text-xl font-semibold">{formatPrice(total)}</span>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Frete calculado no checkout
            </p>
            <div className="flex flex-col gap-3">
              <Button asChild className="w-full" size="lg">
                <Link href="/checkout" onClick={() => setIsOpen(false)}>
                  Finalizar Compra
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
