import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Heart, ShoppingBag } from "lucide-react";
import { Product } from "../../data/products";
import { useCart } from "../contexts/CartContext";
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

/**
 * Hook customizado para gerenciar favoritos
 * Funciona tanto no admin (modo visual) quanto na web (modo funcional)
 */
function useFavoriteLogic(productId: string) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Detectar se estamos no ambiente do editor admin
  const isInEditor = typeof window !== 'undefined' && (
    !!(window as any).Craft ||
    window.location.pathname.includes('/editor') ||
    window.location.pathname.includes('/admin')
  );

  // Verificar favorito inicial apenas na web
  useEffect(() => {
    if (isInEditor || typeof window === 'undefined') return;

    const checkFavorite = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
        const storeId = process.env.NEXT_PUBLIC_STORE_ID;
        const authStorage = localStorage.getItem('auth-storage');
        
        if (!authStorage || !storeId) return;
        
        const parsed = JSON.parse(authStorage);
        const accessToken = parsed?.state?.accessToken;
        if (!accessToken) return;

        const response = await fetch(`${API_URL}/customers/me/favorites/${productId}/check`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'x-store-id': storeId,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setIsFavorite(data.isFavorite || false);
        }
      } catch {
        // Ignorar erros 
      }
    };

    checkFavorite();
  }, [productId, isInEditor]);

  const toggleFavorite = async () => {
    if (isInEditor) {
      // No editor: apenas toggle visual
      setIsFavorite(!isFavorite);
      return;
    }

    // Na web: fazer requisição real
    setIsLoading(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
      const storeId = process.env.NEXT_PUBLIC_STORE_ID;
      const authStorage = localStorage.getItem('auth-storage');
      
      if (!storeId) {
        setIsLoading(false);
        return;
      }
      
      if (!authStorage) {
        window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
        setIsLoading(false);
        return;
      }
      
      const parsed = JSON.parse(authStorage);
      const accessToken = parsed?.state?.accessToken;
      if (!accessToken) {
        window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
        return;
      }

      const method = isFavorite ? 'DELETE' : 'POST';
      const url = isFavorite 
        ? `${API_URL}/customers/me/favorites/${productId}`
        : `${API_URL}/customers/me/favorites`;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'x-store-id': storeId,
        },
        body: !isFavorite ? JSON.stringify({ product_id: productId }) : undefined,
      });

      if (response.ok || response.status === 204) {
        const wasFavorite = isFavorite;
        setIsFavorite(!isFavorite);
        
        // Mostrar notificação
        if (wasFavorite) {
          toast.success('Produto removido dos favoritos', {
            icon: '❤️',
            duration: 3000,
          });
        } else {
          toast.success('Produto adicionado aos favoritos', {
            icon: '❤️',
            duration: 3000,
          });
        }
        
        // Invalidar cache do React Query se disponível
        if ((window as any).__REACT_QUERY_CLIENT__) {
          (window as any).__REACT_QUERY_CLIENT__.invalidateQueries({ queryKey: ['customer-favorites'] });
          (window as any).__REACT_QUERY_CLIENT__.invalidateQueries({ queryKey: ['customer-favorite-check', productId] });
        }
      }
    } catch (error: any) {
      toast.error('Erro ao favoritar produto', {
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return { isFavorite, isLoading, toggleFavorite };
}

/**
 * Componente de botão de favorito para ProductCard
 * Funciona no admin (visual) e na web (funcional)
 */
function FavoriteButtonWrapper({ 
  productId, 
  className 
}: { 
  productId: string
  className?: string 
}) {
  const { isFavorite, isLoading, toggleFavorite } = useFavoriteLogic(productId);
  const buttonRef = useRef<HTMLButtonElement>(null);

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite();
      }}
      disabled={isLoading}
      className={cn(
        "w-9 h-9 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center transition-colors",
        "disabled:opacity-50 disabled:cursor-wait",
        isFavorite ? "text-primary" : "text-foreground hover:text-primary",
        className
      )}
    >
      {isLoading ? (
        <div className="h-[18px] w-[18px] border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <Heart size={18} fill={isFavorite ? "currentColor" : "none"} />
      )}
    </button>
  );
}

interface ProductCardProps {
  product: Product;
  className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
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
    
    // Mostrar notificação
    toast.success('Produto adicionado ao carrinho!', {
      icon: '🛒',
      duration: 3000,
    });
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
          <FavoriteButtonWrapper 
            productId={String(product.id)} 
            className="w-9 h-9"
          />
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
