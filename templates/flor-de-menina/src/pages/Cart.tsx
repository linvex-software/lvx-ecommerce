import { Link } from "react-router-dom";
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft } from "lucide-react";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";

export default function Cart() {
  const { items, removeItem, updateQuantity, total, clearCart } = useCart();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  const shipping = total >= 299 ? 0 : 19.90;
  const finalTotal = total + shipping;

  if (items.length === 0) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag size={64} className="mx-auto text-muted-foreground mb-6" />
          <h1 className="font-display text-3xl mb-4">Sua sacola está vazia</h1>
          <p className="text-muted-foreground font-body mb-8">
            Explore nossa coleção e encontre peças incríveis!
          </p>
          <Button asChild size="lg">
            <Link to="/produtos">Continuar Comprando</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Sacola" }]} />
      </div>

      <div className="container mx-auto px-4 pb-16">
        <h1 className="font-display text-3xl lg:text-4xl mb-8">Minha Sacola</h1>

        <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Items */}
          <div className="lg:col-span-2 space-y-6">
            {items.map((item) => (
              <div
                key={`${item.product.id}-${item.size}-${item.color}`}
                className="flex gap-4 sm:gap-6 p-4 bg-card border border-border animate-fade-in"
              >
                <Link
                  to={`/produto/${item.product.id}`}
                  className="w-24 sm:w-32 h-32 sm:h-40 bg-secondary flex-shrink-0 overflow-hidden"
                >
                  <img
                    src={item.product.images[0]}
                    alt={item.product.name}
                    className="w-full h-full object-cover"
                  />
                </Link>
                
                <div className="flex-1 flex flex-col">
                  <div className="flex justify-between">
                    <div>
                      <Link
                        to={`/produto/${item.product.id}`}
                        className="font-body font-medium hover:text-primary transition-colors"
                      >
                        {item.product.name}
                      </Link>
                      <p className="text-sm text-muted-foreground mt-1">
                        Tamanho: {item.size} | Cor: {item.color}
                      </p>
                    </div>
                    <button
                      onClick={() => removeItem(item.product.id, item.size, item.color)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  <div className="mt-auto flex items-end justify-between">
                    <div className="flex items-center border border-border">
                      <button
                        onClick={() =>
                          updateQuantity(item.product.id, item.size, item.color, item.quantity - 1)
                        }
                        className="w-10 h-10 flex items-center justify-center hover:bg-secondary transition-colors"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-12 text-center text-sm font-medium">{item.quantity}</span>
                      <button
                        onClick={() =>
                          updateQuantity(item.product.id, item.size, item.color, item.quantity + 1)
                        }
                        className="w-10 h-10 flex items-center justify-center hover:bg-secondary transition-colors"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-xl">
                        {formatPrice(item.product.price * item.quantity)}
                      </p>
                      {item.quantity > 1 && (
                        <p className="text-xs text-muted-foreground">
                          {formatPrice(item.product.price)} cada
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <Link
              to="/produtos"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-body text-sm"
            >
              <ArrowLeft size={16} />
              Continuar Comprando
            </Link>
          </div>

          {/* Summary */}
          <div>
            <div className="bg-card border border-border p-6 sticky top-24">
              <h2 className="font-display text-xl mb-6">Resumo do Pedido</h2>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-sm font-body">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatPrice(total)}</span>
                </div>
                <div className="flex justify-between text-sm font-body">
                  <span className="text-muted-foreground">Frete</span>
                  <span className={shipping === 0 ? "text-primary" : ""}>
                    {shipping === 0 ? "Grátis" : formatPrice(shipping)}
                  </span>
                </div>
                {shipping > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Frete grátis para compras acima de R$ 299
                  </p>
                )}
              </div>

              <div className="border-t border-border pt-4 mb-6">
                <div className="flex justify-between">
                  <span className="font-display text-lg">Total</span>
                  <span className="font-display text-2xl">{formatPrice(finalTotal)}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  ou 3x de {formatPrice(finalTotal / 3)} sem juros
                </p>
              </div>

              <Button asChild className="w-full" size="lg">
                <Link to="/checkout">Finalizar Compra</Link>
              </Button>

              <div className="mt-6 pt-6 border-t border-border">
                <p className="text-xs text-muted-foreground text-center mb-4">
                  Aceitamos
                </p>
                <div className="flex justify-center gap-4">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/200px-Visa_Inc._logo.svg.png" alt="Visa" className="h-5 opacity-50" />
                  <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/200px-Mastercard-logo.svg.png" alt="Mastercard" className="h-5 opacity-50" />
                  <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/PayPal.svg/200px-PayPal.svg.png" alt="PayPal" className="h-5 opacity-50" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
