import { X, Plus, Minus, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/lib/store/useCartStore";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import Link from "next/link";

const Cart = () => {
  const { items, closeCart, removeItem, updateQuantity } = useCartStore();
  const router = useRouter();

  const total = useMemo(() => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [items]);

  const handleCheckout = () => {
    closeCart();
    router.push("/checkout");
  };

  const handleQuantityChange = (id: number | string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(id);
      return;
    }
    updateQuantity(id, newQuantity);
  };

  return (
    <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50 flex justify-end">
      <div className="bg-background w-full max-w-md h-full shadow-2xl flex flex-col">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h2 className="text-2xl font-bold">Carrinho</h2>
          <Button variant="ghost" size="icon" onClick={closeCart}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {items.length === 0 ? (
            <p className="text-center text-muted-foreground mt-8">Carrinho vazio</p>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex gap-4 border-b border-border pb-4">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-20 h-20 object-cover bg-secondary rounded-md"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm line-clamp-2">{item.name}</h3>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center border border-border rounded-md">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="px-3 text-sm font-medium min-w-[2rem] text-center">
                          {item.quantity}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <p className="font-bold mt-2 text-sm">R$ {(item.price * item.quantity).toFixed(2)}</p>
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
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="p-6 border-t border-border space-y-4">
            <div className="flex justify-between text-lg font-bold">
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
              className="w-full"
              size="lg"
              asChild
              onClick={closeCart}
            >
              <Link href="/carrinho">
                <ShoppingBag className="h-4 w-4 mr-2" />
                Ver Carrinho Completo
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
