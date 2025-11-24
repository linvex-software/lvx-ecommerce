import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/lib/store/useCartStore";
import { useRouter } from "next/navigation";
import { useMemo } from "react";

const Cart = () => {
  const { items, closeCart, removeItem } = useCartStore();
  const router = useRouter();

  const total = useMemo(() => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [items]);

  const handleCheckout = () => {
    closeCart();
    router.push("/checkout");
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
                    className="w-20 h-20 object-cover bg-secondary"
                  />
                  <div className="flex-1">
                    <h3 className="font-bold">{item.name}</h3>
                    <p className="text-sm text-muted-foreground">Qtd: {item.quantity}</p>
                    <p className="font-bold mt-1">R$ {(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(item.id)}
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
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
