import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Heart, Minus, Plus, Truck, RefreshCw, Shield, ChevronLeft, ChevronRight } from "lucide-react";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { ProductShowcase } from "@/components/home/ProductShowcase";
import { Button } from "@/components/ui/button";
import { products } from "@/data/products";
import { useCart } from "@/contexts/CartContext";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function ProductDetail() {
  const { id } = useParams();
  const { addItem } = useCart();
  const { toast } = useToast();
  
  const product = products.find((p) => p.id === id);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState(product?.colors[0]?.name || "");
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-display text-2xl mb-4">Produto não encontrado</h1>
          <Button asChild>
            <Link to="/produtos">Ver Produtos</Link>
          </Button>
        </div>
      </div>
    );
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  const handleAddToCart = () => {
    if (!selectedSize) {
      toast({
        title: "Selecione um tamanho",
        description: "Por favor, escolha um tamanho antes de adicionar ao carrinho.",
        variant: "destructive",
      });
      return;
    }
    addItem(product, selectedSize, selectedColor, quantity);
    toast({
      title: "Adicionado à sacola!",
      description: `${product.name} - Tam. ${selectedSize}`,
    });
  };

  const relatedProducts = products
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  const nextImage = () => {
    setSelectedImage((prev) => (prev + 1) % product.images.length);
  };

  const prevImage = () => {
    setSelectedImage((prev) => (prev - 1 + product.images.length) % product.images.length);
  };

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-4">
        <Breadcrumbs
          items={[
            { label: "Produtos", href: "/produtos" },
            { label: product.category, href: `/produtos?category=${product.category.toLowerCase()}` },
            { label: product.name },
          ]}
        />
      </div>

      <div className="container mx-auto px-4 pb-16">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16">
          {/* Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative aspect-[3/4] bg-secondary overflow-hidden group">
              <img
                src={product.images[selectedImage]}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              
              {product.images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-background/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-background/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              )}

              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {product.isNew && (
                  <span className="bg-primary text-primary-foreground text-xs tracking-widest px-3 py-1 uppercase font-body">
                    Novo
                  </span>
                )}
                {product.originalPrice && (
                  <span className="bg-charcoal text-secondary text-xs tracking-widest px-3 py-1 uppercase font-body">
                    -{Math.round((1 - product.price / product.originalPrice) * 100)}%
                  </span>
                )}
              </div>
            </div>

            {/* Thumbnails */}
            {product.images.length > 1 && (
              <div className="flex gap-2">
                {product.images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={cn(
                      "w-20 h-24 border-2 overflow-hidden transition-colors",
                      selectedImage === index ? "border-primary" : "border-transparent"
                    )}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="lg:py-8">
            <h1 className="font-display text-3xl lg:text-4xl text-foreground mb-4">
              {product.name}
            </h1>

            {/* Price */}
            <div className="flex items-center gap-4 mb-6">
              <span className="font-display text-3xl text-foreground">
                {formatPrice(product.price)}
              </span>
              {product.originalPrice && (
                <span className="text-muted-foreground line-through text-lg">
                  {formatPrice(product.originalPrice)}
                </span>
              )}
            </div>

            {/* Installments */}
            <p className="text-muted-foreground font-body text-sm mb-8">
              ou 3x de {formatPrice(product.price / 3)} sem juros
            </p>

            {/* Colors */}
            <div className="mb-6">
              <h3 className="font-body text-sm font-medium mb-3">
                Cor: <span className="font-normal">{selectedColor}</span>
              </h3>
              <div className="flex gap-3">
                {product.colors.map((color) => (
                  <button
                    key={color.name}
                    onClick={() => setSelectedColor(color.name)}
                    className={cn(
                      "w-10 h-10 rounded-full border-2 transition-all",
                      selectedColor === color.name
                        ? "ring-2 ring-primary ring-offset-2"
                        : "border-border"
                    )}
                    style={{ backgroundColor: color.hex }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            {/* Sizes */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-body text-sm font-medium">Tamanho</h3>
                <button className="text-xs text-primary underline">Guia de Tamanhos</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={cn(
                      "min-w-[48px] h-12 px-4 border text-sm font-body transition-colors",
                      selectedSize === size
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border hover:border-primary"
                    )}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div className="mb-8">
              <h3 className="font-body text-sm font-medium mb-3">Quantidade</h3>
              <div className="flex items-center border border-border w-fit">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-12 h-12 flex items-center justify-center hover:bg-secondary transition-colors"
                >
                  <Minus size={16} />
                </button>
                <span className="w-16 text-center font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-12 h-12 flex items-center justify-center hover:bg-secondary transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 mb-8">
              <Button onClick={handleAddToCart} size="xl" className="flex-1">
                Adicionar à Sacola
              </Button>
              <button
                onClick={() => setIsFavorite(!isFavorite)}
                className={cn(
                  "w-14 h-14 border flex items-center justify-center transition-colors",
                  isFavorite
                    ? "border-primary text-primary bg-primary/5"
                    : "border-border hover:border-primary"
                )}
              >
                <Heart size={20} fill={isFavorite ? "currentColor" : "none"} />
              </button>
            </div>

            {/* Benefits */}
            <div className="border-t border-border pt-8 space-y-4">
              <div className="flex items-center gap-4">
                <Truck size={20} className="text-primary" />
                <div>
                  <p className="font-body text-sm font-medium">Frete Grátis</p>
                  <p className="text-xs text-muted-foreground">Para compras acima de R$ 299</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <RefreshCw size={20} className="text-primary" />
                <div>
                  <p className="font-body text-sm font-medium">Troca Fácil</p>
                  <p className="text-xs text-muted-foreground">Primeira troca grátis em até 30 dias</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Shield size={20} className="text-primary" />
                <div>
                  <p className="font-body text-sm font-medium">Compra Segura</p>
                  <p className="text-xs text-muted-foreground">Seus dados protegidos</p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="border-t border-border pt-8 mt-8">
              <h3 className="font-display text-lg mb-4">Descrição</h3>
              <p className="text-muted-foreground font-body text-sm leading-relaxed">
                {product.description}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <ProductShowcase
          title="Você Também Vai Gostar"
          products={relatedProducts}
          viewAllLink={`/produtos?category=${product.category.toLowerCase()}`}
        />
      )}
    </div>
  );
}
