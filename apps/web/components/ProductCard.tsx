import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export interface Product {
  id: number | string
  name: string
  price: number
  image: string
  category: string
  sizes?: string[]
  colors?: { name: string; hex: string }[]
  stock?: number
  description?: string
}

interface ProductCardProps {
  product: Product
  onAddToCart: (product: Product) => void
}

const ProductCard = ({ product, onAddToCart }: ProductCardProps) => {
  const stock = product.stock ?? 0
  const colors = product.colors ?? []
  const sizes = product.sizes ?? []

  const isLowStock = stock > 0 && stock <= 5
  const isOutOfStock = stock === 0

  return (
    <Card className="group overflow-hidden border border-border hover:border-foreground transition-all duration-300">
      <div className="relative aspect-square overflow-hidden bg-secondary">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {isOutOfStock && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
            <span className="text-sm font-bold uppercase tracking-wider">Esgotado</span>
          </div>
        )}
        {isLowStock && !isOutOfStock && (
          <div className="absolute top-3 right-3 bg-destructive text-destructive-foreground px-2 py-1 text-xs font-semibold">
            Últimas unidades
          </div>
        )}
      </div>
      <div className="p-4 space-y-3">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            {product.category}
          </p>
          <h3 className="text-lg font-bold mt-1">{product.name}</h3>
        </div>

        {/* Available Colors */}
        {colors.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Cores:</span>
            <div className="flex gap-1">
              {colors.slice(0, 4).map((color) => (
                <div
                  key={color.name}
                  className="w-5 h-5 rounded-full border border-border"
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                />
              ))}
              {colors.length > 4 && (
                <span className="text-xs text-muted-foreground ml-1">
                  +{colors.length - 4}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Available Sizes */}
        {sizes.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Tamanhos:</span>
            <div className="flex gap-1 flex-wrap">
              {sizes.map((size) => (
                <span key={size} className="text-xs px-2 py-1 border border-border">
                  {size}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <p className="text-xl font-bold">R$ {product.price.toFixed(2)}</p>
          <Button
            variant="default"
            size="sm"
            onClick={() => onAddToCart(product)}
            disabled={isOutOfStock}
            className="bg-foreground text-background hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isOutOfStock ? 'Esgotado' : 'Adicionar'}
          </Button>
        </div>
      </div>
    </Card>
  )
}

export default ProductCard
