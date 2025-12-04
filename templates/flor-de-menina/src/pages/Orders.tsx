import { Link } from "react-router-dom";
import { Package, ChevronRight, Truck } from "lucide-react";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { Button } from "@/components/ui/button";

// Mock orders data
const orders = [
  {
    id: "12345",
    date: "2024-12-01",
    status: "delivered",
    statusLabel: "Entregue",
    total: 459.90,
    items: [
      {
        name: "Conjunto Branco Luxo",
        size: "M",
        quantity: 1,
        price: 459.90,
        image: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=200&h=250&fit=crop",
      },
    ],
  },
  {
    id: "12344",
    date: "2024-11-28",
    status: "shipped",
    statusLabel: "Em Trânsito",
    total: 639.80,
    items: [
      {
        name: "Vestido Vermelho Festa",
        size: "P",
        quantity: 1,
        price: 389.90,
        image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=200&h=250&fit=crop",
      },
      {
        name: "Saia Midi Plissada",
        size: "M",
        quantity: 1,
        price: 249.90,
        image: "https://images.unsplash.com/photo-1583496661160-fb5886a0uj0?w=200&h=250&fit=crop",
      },
    ],
  },
];

export default function Orders() {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-800";
      case "shipped":
        return "bg-blue-100 text-blue-800";
      case "processing":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (orders.length === 0) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center">
          <Package size={64} className="mx-auto text-muted-foreground mb-6" />
          <h1 className="font-display text-3xl mb-4">Nenhum pedido encontrado</h1>
          <p className="text-muted-foreground font-body mb-8">
            Você ainda não realizou nenhuma compra
          </p>
          <Button asChild size="lg">
            <Link to="/produtos">Explorar Produtos</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Minhas Compras" }]} />
      </div>

      <div className="container mx-auto px-4 pb-16">
        <h1 className="font-display text-3xl lg:text-4xl mb-8">Minhas Compras</h1>

        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.id} className="bg-card border border-border p-6">
              {/* Order Header */}
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-border">
                <div className="flex flex-wrap items-center gap-4 sm:gap-8">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Pedido</p>
                    <p className="font-body font-medium">#{order.id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Data</p>
                    <p className="font-body">{formatDate(order.date)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Total</p>
                    <p className="font-body font-medium">{formatPrice(order.total)}</p>
                  </div>
                </div>
                <span
                  className={`px-3 py-1 text-xs font-body tracking-wider uppercase ${getStatusColor(
                    order.status
                  )}`}
                >
                  {order.statusLabel}
                </span>
              </div>

              {/* Order Items */}
              <div className="space-y-4 mb-6">
                {order.items.map((item, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="w-16 h-20 bg-secondary flex-shrink-0">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="font-body font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Tamanho: {item.size} | Qtd: {item.quantity}
                      </p>
                      <p className="text-sm font-medium mt-1">{formatPrice(item.price)}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Actions */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-border">
                {order.status === "shipped" && (
                  <button className="flex items-center gap-2 text-sm text-primary font-body hover:underline">
                    <Truck size={16} />
                    Rastrear Pedido
                  </button>
                )}
                <button className="flex items-center gap-2 text-sm text-muted-foreground font-body hover:text-foreground ml-auto">
                  Ver Detalhes
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
