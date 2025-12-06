'use client'

interface ProductCardProps {
  id: string
  name: string
  price: string
  image?: string
  slug: string
}

export function ProductCard({
  id,
  name,
  price,
  image,
  slug
}: ProductCardProps) {
  return (
    <div className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
      {image ? (
        <img
          src={image}
          alt={name}
          className="w-full h-48 object-cover"
        />
      ) : (
        <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
          <span style={{ color: 'var(--store-text-color, #000000)' }}>Sem imagem</span>
        </div>
      )}
      <div className="p-4">
        <h3 className="font-semibold mb-2">{name}</h3>
        <p className="text-lg font-bold text-blue-600">
          R$ {parseFloat(price).toFixed(2).replace('.', ',')}
        </p>
      </div>
    </div>
  )
}




