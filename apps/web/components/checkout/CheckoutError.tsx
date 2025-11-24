import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";

interface CheckoutErrorProps {
    message: string;
    onRetry: () => void;
}

const CheckoutError = ({ message, onRetry }: CheckoutErrorProps) => {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-center space-y-6">
            <XCircle className="w-24 h-24 text-destructive" />
            <h1 className="text-4xl font-bold">Erro no Pedido</h1>
            <p className="text-xl text-muted-foreground">{message}</p>
            <Button onClick={onRetry} size="lg">
                Tentar Novamente
            </Button>
        </div>
    );
};

export default CheckoutError;
