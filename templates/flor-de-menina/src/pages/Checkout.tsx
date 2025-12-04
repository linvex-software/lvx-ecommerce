import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Check, CreditCard, Truck, User, ChevronRight } from "lucide-react";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type Step = "personal" | "address" | "shipping" | "payment" | "review";

const steps: { id: Step; label: string; icon: React.ElementType }[] = [
  { id: "personal", label: "Dados Pessoais", icon: User },
  { id: "address", label: "Endereço", icon: Truck },
  { id: "shipping", label: "Entrega", icon: Truck },
  { id: "payment", label: "Pagamento", icon: CreditCard },
  { id: "review", label: "Revisão", icon: Check },
];

export default function Checkout() {
  const { items, total, clearCart } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<Step>("personal");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    cpf: "",
    cep: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    shipping: "standard",
    paymentMethod: "credit",
    cardNumber: "",
    cardName: "",
    cardExpiry: "",
    cardCvv: "",
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  const shippingCost = formData.shipping === "express" ? 29.90 : total >= 299 ? 0 : 19.90;
  const finalTotal = total + shippingCost;

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const nextStep = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex].id);
    }
  };

  const prevStep = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex].id);
    }
  };

  const handleSubmit = () => {
    toast({
      title: "Pedido realizado com sucesso!",
      description: "Você receberá um e-mail com os detalhes do pedido.",
    });
    clearCart();
    navigate("/pedidos");
  };

  if (items.length === 0) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-display text-3xl mb-4">Seu carrinho está vazio</h1>
          <Button asChild>
            <Link to="/produtos">Continuar Comprando</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <div className="container mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Sacola", href: "/carrinho" }, { label: "Checkout" }]} />
      </div>

      <div className="container mx-auto px-4 pb-16">
        {/* Progress */}
        <div className="mb-12 overflow-x-auto">
          <div className="flex items-center justify-center min-w-max gap-2">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <button
                  onClick={() => index <= currentStepIndex && setCurrentStep(step.id)}
                  disabled={index > currentStepIndex}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-full transition-colors",
                    currentStep === step.id
                      ? "bg-primary text-primary-foreground"
                      : index < currentStepIndex
                      ? "bg-primary/20 text-primary cursor-pointer"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <step.icon size={16} />
                  <span className="text-sm font-body hidden sm:inline">{step.label}</span>
                </button>
                {index < steps.length - 1 && (
                  <ChevronRight size={20} className="text-muted-foreground mx-2" />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Form */}
          <div className="lg:col-span-2">
            <div className="bg-background p-6 lg:p-8 border border-border">
              {/* Personal Data */}
              {currentStep === "personal" && (
                <div className="space-y-6 animate-fade-in">
                  <h2 className="font-display text-2xl mb-6">Dados Pessoais</h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-body mb-2">Nome Completo</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-border bg-background font-body focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="Seu nome completo"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-body mb-2">E-mail</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-border bg-background font-body focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="seu@email.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-body mb-2">Telefone</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-border bg-background font-body focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="(00) 00000-0000"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-body mb-2">CPF</label>
                      <input
                        type="text"
                        name="cpf"
                        value={formData.cpf}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-border bg-background font-body focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="000.000.000-00"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Address */}
              {currentStep === "address" && (
                <div className="space-y-6 animate-fade-in">
                  <h2 className="font-display text-2xl mb-6">Endereço de Entrega</h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-body mb-2">CEP</label>
                      <input
                        type="text"
                        name="cep"
                        value={formData.cep}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-border bg-background font-body focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="00000-000"
                      />
                    </div>
                    <div></div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-body mb-2">Rua</label>
                      <input
                        type="text"
                        name="street"
                        value={formData.street}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-border bg-background font-body focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="Nome da rua"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-body mb-2">Número</label>
                      <input
                        type="text"
                        name="number"
                        value={formData.number}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-border bg-background font-body focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="000"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-body mb-2">Complemento</label>
                      <input
                        type="text"
                        name="complement"
                        value={formData.complement}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-border bg-background font-body focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="Apto, Bloco..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-body mb-2">Bairro</label>
                      <input
                        type="text"
                        name="neighborhood"
                        value={formData.neighborhood}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-border bg-background font-body focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="Bairro"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-body mb-2">Cidade</label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-border bg-background font-body focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="Cidade"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Shipping */}
              {currentStep === "shipping" && (
                <div className="space-y-6 animate-fade-in">
                  <h2 className="font-display text-2xl mb-6">Método de Entrega</h2>
                  <div className="space-y-4">
                    <label
                      className={cn(
                        "flex items-center gap-4 p-4 border cursor-pointer transition-colors",
                        formData.shipping === "standard" ? "border-primary bg-primary/5" : "border-border"
                      )}
                    >
                      <input
                        type="radio"
                        name="shipping"
                        value="standard"
                        checked={formData.shipping === "standard"}
                        onChange={handleInputChange}
                        className="sr-only"
                      />
                      <div className={cn(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                        formData.shipping === "standard" ? "border-primary" : "border-muted-foreground"
                      )}>
                        {formData.shipping === "standard" && (
                          <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-body font-medium">Entrega Padrão</p>
                        <p className="text-sm text-muted-foreground">5-8 dias úteis</p>
                      </div>
                      <span className="font-body font-medium">
                        {total >= 299 ? "Grátis" : formatPrice(19.90)}
                      </span>
                    </label>
                    <label
                      className={cn(
                        "flex items-center gap-4 p-4 border cursor-pointer transition-colors",
                        formData.shipping === "express" ? "border-primary bg-primary/5" : "border-border"
                      )}
                    >
                      <input
                        type="radio"
                        name="shipping"
                        value="express"
                        checked={formData.shipping === "express"}
                        onChange={handleInputChange}
                        className="sr-only"
                      />
                      <div className={cn(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                        formData.shipping === "express" ? "border-primary" : "border-muted-foreground"
                      )}>
                        {formData.shipping === "express" && (
                          <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-body font-medium">Entrega Expressa</p>
                        <p className="text-sm text-muted-foreground">2-3 dias úteis</p>
                      </div>
                      <span className="font-body font-medium">{formatPrice(29.90)}</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Payment */}
              {currentStep === "payment" && (
                <div className="space-y-6 animate-fade-in">
                  <h2 className="font-display text-2xl mb-6">Pagamento</h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-body mb-2">Número do Cartão</label>
                      <input
                        type="text"
                        name="cardNumber"
                        value={formData.cardNumber}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-border bg-background font-body focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="0000 0000 0000 0000"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-body mb-2">Nome no Cartão</label>
                      <input
                        type="text"
                        name="cardName"
                        value={formData.cardName}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-border bg-background font-body focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="Como está no cartão"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-body mb-2">Validade</label>
                      <input
                        type="text"
                        name="cardExpiry"
                        value={formData.cardExpiry}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-border bg-background font-body focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="MM/AA"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-body mb-2">CVV</label>
                      <input
                        type="text"
                        name="cardCvv"
                        value={formData.cardCvv}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-border bg-background font-body focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="000"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Review */}
              {currentStep === "review" && (
                <div className="space-y-6 animate-fade-in">
                  <h2 className="font-display text-2xl mb-6">Revisão do Pedido</h2>
                  
                  <div className="space-y-4">
                    <div className="p-4 bg-secondary/50">
                      <h3 className="font-body font-medium mb-2">Dados Pessoais</h3>
                      <p className="text-sm text-muted-foreground">{formData.name}</p>
                      <p className="text-sm text-muted-foreground">{formData.email}</p>
                      <p className="text-sm text-muted-foreground">{formData.phone}</p>
                    </div>
                    
                    <div className="p-4 bg-secondary/50">
                      <h3 className="font-body font-medium mb-2">Endereço</h3>
                      <p className="text-sm text-muted-foreground">
                        {formData.street}, {formData.number} {formData.complement && `- ${formData.complement}`}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formData.neighborhood}, {formData.city}
                      </p>
                      <p className="text-sm text-muted-foreground">CEP: {formData.cep}</p>
                    </div>

                    <div className="p-4 bg-secondary/50">
                      <h3 className="font-body font-medium mb-2">Entrega</h3>
                      <p className="text-sm text-muted-foreground">
                        {formData.shipping === "express" ? "Expressa (2-3 dias úteis)" : "Padrão (5-8 dias úteis)"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex justify-between mt-8 pt-8 border-t border-border">
                {currentStepIndex > 0 ? (
                  <Button variant="outline" onClick={prevStep}>
                    Voltar
                  </Button>
                ) : (
                  <div />
                )}
                {currentStep === "review" ? (
                  <Button onClick={handleSubmit} size="lg">
                    Finalizar Pedido
                  </Button>
                ) : (
                  <Button onClick={nextStep}>Continuar</Button>
                )}
              </div>
            </div>
          </div>

          {/* Summary */}
          <div>
            <div className="bg-background border border-border p-6 sticky top-24">
              <h2 className="font-display text-xl mb-6">Resumo</h2>
              
              <div className="space-y-4 mb-6">
                {items.map((item) => (
                  <div
                    key={`${item.product.id}-${item.size}`}
                    className="flex gap-3"
                  >
                    <div className="w-16 h-20 bg-secondary flex-shrink-0">
                      <img
                        src={item.product.images[0]}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-body line-clamp-1">{item.product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Tam: {item.size} | Qtd: {item.quantity}
                      </p>
                      <p className="text-sm font-medium mt-1">
                        {formatPrice(item.product.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3 pt-4 border-t border-border">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatPrice(total)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Frete</span>
                  <span>{shippingCost === 0 ? "Grátis" : formatPrice(shippingCost)}</span>
                </div>
                <div className="flex justify-between pt-3 border-t border-border">
                  <span className="font-display text-lg">Total</span>
                  <span className="font-display text-xl">{formatPrice(finalTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
