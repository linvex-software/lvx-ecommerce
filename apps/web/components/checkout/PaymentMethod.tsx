import { useCheckoutStore, PaymentMethod as PaymentMethodType } from "@/lib/store/useCheckoutStore";
import { CreditCard, QrCode } from "lucide-react";
import { Input } from "@/components/ui/input";

const PaymentMethod = () => {
    const { formData, setFormData } = useCheckoutStore();

    const handleMethodChange = (method: PaymentMethodType) => {
        setFormData({ paymentMethod: method });
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold">Pagamento</h2>

            <div className="grid grid-cols-2 gap-4">
                <button
                    type="button"
                    className={`flex flex-col items-center justify-center p-4 border rounded-lg transition-all ${formData.paymentMethod === "pix"
                            ? "border-foreground bg-secondary/50"
                            : "border-border hover:border-foreground/50"
                        }`}
                    onClick={() => handleMethodChange("pix")}
                >
                    <QrCode className="w-8 h-8 mb-2" />
                    <span className="font-medium">Pix</span>
                </button>
                <button
                    type="button"
                    className={`flex flex-col items-center justify-center p-4 border rounded-lg transition-all ${formData.paymentMethod === "card"
                            ? "border-foreground bg-secondary/50"
                            : "border-border hover:border-foreground/50"
                        }`}
                    onClick={() => handleMethodChange("card")}
                >
                    <CreditCard className="w-8 h-8 mb-2" />
                    <span className="font-medium">Cartão de Crédito</span>
                </button>
            </div>

            {formData.paymentMethod === "pix" && (
                <div className="bg-secondary/20 p-4 rounded-lg text-sm text-muted-foreground">
                    <p>O QR Code para pagamento será gerado após a finalização do pedido.</p>
                    <p>Aprovação imediata.</p>
                </div>
            )}

            {formData.paymentMethod === "card" && (
                <div className="space-y-4 border p-4 rounded-lg border-border">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Número do Cartão</label>
                        <Input placeholder="0000 0000 0000 0000" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Nome no Cartão</label>
                        <Input placeholder="Como está no cartão" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Validade</label>
                            <Input placeholder="MM/AA" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">CVV</label>
                            <Input placeholder="123" />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PaymentMethod;
