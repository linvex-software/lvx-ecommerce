'use client'

import { useCartStore } from "@/lib/store/useCartStore";
import { useCheckoutStore } from "@/lib/store/useCheckoutStore";
import { Button } from "@/components/ui/button";
import { useMemo } from "react";

interface OrderSummaryProps {
    onCheckout: () => void;
    isLoading: boolean;
    isDeliverySelected?: boolean;
}

const OrderSummary = ({ onCheckout, isLoading, isDeliverySelected = false }: OrderSummaryProps) => {
    const { items } = useCartStore();
    const { shippingCost } = useCheckoutStore();

    const subtotal = useMemo(() => {
        return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    }, [items]);

    const shipping = shippingCost || 0;
    const total = subtotal + shipping;

    return (
        <div className="bg-card border border-border rounded-lg p-6 space-y-6 sticky top-24">
            <h2 className="text-xl font-bold">Resumo do Pedido</h2>

            <div className="space-y-4 max-h-96 overflow-auto">
                {items.map((item) => (
                    <div key={item.id} className="flex gap-4">
                        <img
                            src={item.image}
                            alt={item.name}
                            className="w-16 h-16 object-cover rounded-md bg-secondary"
                        />
                        <div className="flex-1">
                            <h3 className="text-sm font-medium line-clamp-2">{item.name}</h3>
                            <p className="text-xs text-muted-foreground">Qtd: {item.quantity}</p>
                            <p className="text-sm font-bold mt-1">R$ {(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="border-t border-border pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>R$ {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Frete</span>
                    <span>{shipping === 0 ? "Grátis" : `R$ ${shipping.toFixed(2)} `}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
                    <span>Total</span>
                    <span>R$ {total.toFixed(2)}</span>
                </div>
            </div>

            <Button
                className="w-full bg-foreground text-background hover:bg-accent"
                size="lg"
                onClick={onCheckout}
                disabled={isLoading || items.length === 0 || !isDeliverySelected}
            >
                {isLoading ? "Processando..." : "Finalizar Pedido"}
            </Button>
            {!isDeliverySelected && items.length > 0 && (
                <p className="text-xs text-destructive text-center">
                    Selecione uma opção de entrega para continuar
                </p>
            )}
        </div>
    );
};

export default OrderSummary;
