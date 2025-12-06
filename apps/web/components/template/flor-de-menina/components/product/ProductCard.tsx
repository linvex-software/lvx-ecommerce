import { useState } from "react";
import Link from "next/link";
import { Heart, ShoppingBag } from "lucide-react";
import { Product } from "../../data/products";
import { useCart } from "../contexts/CartContext";
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
  className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const { addItem } = useCart();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Verificar se sizes e colors existem antes de usar
    const size = product.sizes && product.sizes.length > 0 ? product.sizes[0] : '';
    const color = product.colors && product.colors.length > 0 ? product.colors[0].name : '';
    
    addItem(product, size, color);
  };

  const handleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFavorite(!isFavorite);
  };

  // Usar slug se disponível, senão usar id
  const productUrl = product.slug ? `/produto/${product.slug}` : `/produto/${product.id}`

  return (
    <Link
      href={productUrl}
      className={cn("group block", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <div className="relative aspect-[3/4] overflow-hidden bg-secondary mb-4">
        <img
          src={product.images[0]}
          alt={product.name}
          className={cn(
            "w-full h-full object-cover transition-transform duration-700",
            isHovered && "scale-105"
          )}
        />
        
        {/* Second image on hover */}
        {product.images[1] && (
          <img
            src={product.images[1]}
            alt={product.name}
            className={cn(
              "absolute inset-0 w-full h-full object-cover transition-opacity duration-500",
              isHovered ? "opacity-100" : "opacity-0"
            )}
          />
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {product.isNew && (
            <span className="bg-primary text-primary-foreground text-[10px] tracking-widest px-3 py-1 uppercase font-body">
              Novo
            </span>
          )}
          {product.isBestSeller && (
            <span className="bg-gold text-accent-foreground text-[10px] tracking-widest px-3 py-1 uppercase font-body">
              Mais Vendido
            </span>
          )}
          {product.originalPrice && (
            <span className="bg-charcoal text-secondary text-[10px] tracking-widest px-3 py-1 uppercase font-body">
              -{Math.round((1 - product.price / product.originalPrice) * 100)}%
            </span>
          )}
        </div>

        {/* Actions */}
        <div className={cn(
          "absolute top-3 right-3 flex flex-col gap-2 transition-all duration-300",
          isHovered ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"
        )}>
          <button
            onClick={handleFavorite}
            className={cn(
              "w-9 h-9 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center transition-colors",
              isFavorite ? "text-primary" : "text-foreground hover:text-primary"
            )}
          >
            <Heart size={18} fill={isFavorite ? "currentColor" : "none"} />
          </button>
        </div>

        {/* Quick Add */}
        <div className={cn(
          "absolute bottom-0 left-0 right-0 p-4 transition-all duration-300",
          isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}>
          <button
            onClick={handleQuickAdd}
            className="w-full py-3 bg-background/95 backdrop-blur-sm text-foreground text-xs tracking-widest uppercase font-body hover:bg-primary hover:text-primary-foreground transition-colors flex items-center justify-center gap-2"
          >
            <ShoppingBag size={14} />
            Adicionar Rápido
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="text-center">
        <h3 className="font-body text-sm tracking-wide mb-2 group-hover:text-primary transition-colors">
          {product.name}
        </h3>
        <div className="flex items-center justify-center gap-2">
          {product.originalPrice && (
            <span className="text-muted-foreground text-sm line-through">
              {formatPrice(product.originalPrice)}
            </span>
          )}
          <span className={cn(
            "font-body font-semibold",
            product.originalPrice ? "text-primary" : "text-foreground"
          )}>
            {formatPrice(product.price)}
          </span>
        </div>
        
        {/* Colors */}
        <div className="flex items-center justify-center gap-1 mt-3">
          {product.colors.map((color) => (
            <span
              key={color.name}
              className="w-4 h-4 rounded-full border border-border"
              style={{ backgroundColor: color.hex }}
              title={color.name}
            />
          ))}
        </div>
      </div>
    </Link>
  );
}
