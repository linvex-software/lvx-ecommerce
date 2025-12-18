'use client'

import Link from 'next/link'

interface ProductCardProps {
  id: string
  name: string
  price: string
  image?: string
  slug: string
  stock?: number
}

export function ProductCard({
  id,
  name,
  price,
  image,
  slug,
  stock
}: ProductCardProps) {
  const currentStock = stock ?? 0
  const isOutOfStock = currentStock === 0

  return (
    <Link href={`/products/${slug}`}>
      <div className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
        <div className="relative">
          {image ? (
            <img
              src={image}
              alt={name}
              className={`w-full h-48 object-cover ${isOutOfStock ? 'opacity-70' : ''}`}
            />
          ) : (
            <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
              <span style={{ color: 'var(--store-text-color, #000000)' }}>Sem imagem</span>
            </div>
          )}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
              <span className="text-sm font-bold uppercase tracking-wider">Esgotado</span>
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-semibold mb-2" style={{ color: 'var(--store-text-color, #000000)' }}>{name}</h3>
          {isOutOfStock ? (
            <p className="text-lg font-bold text-destructive">ESGOTADO</p>
          ) : (
            <p className="text-lg font-bold" style={{ color: 'var(--store-primary-color, #000000)' }}>
              R$ {parseFloat(price).toFixed(2).replace('.', ',')}
            </p>
          )}
        </div>
      </div>
    </Link>
  )
}




