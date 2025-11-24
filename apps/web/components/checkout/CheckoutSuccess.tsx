import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import Link from "next/link";

interface CheckoutSuccessProps {
    orderId: string;
}

const CheckoutSuccess = ({ orderId }: CheckoutSuccessProps) => {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-center space-y-6">
            <CheckCircle className="w-24 h-24 text-green-500" />
            <h1 className="text-4xl font-bold">Pedido Confirmado!</h1>
            <p className="text-xl text-muted-foreground">
                Seu pedido #{orderId} foi realizado com sucesso.
            </p>
            <Button asChild size="lg">
                <Link href="/">Voltar para a Loja</Link>
            </Button>
        </div>
    );
};

export default CheckoutSuccess;
