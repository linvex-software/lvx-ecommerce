'use client'

import Image from 'next/image'
import Link from 'next/link'
import { MoreVertical, Edit, Trash2, Eye, EyeOff } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@white-label/ui'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import type { Product } from '@/lib/hooks/use-products'
import { useToggleProductStatus, useDeleteProduct, useProductStock } from '@/lib/hooks/use-products'
import { useState } from 'react'

interface ProductTableProps {
  products: Product[]
  isLoading?: boolean
}

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL'
})

export function ProductTable({ products, isLoading = false }: ProductTableProps) {
  const toggleStatus = useToggleProductStatus()
  const deleteProduct = useDeleteProduct()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const getMainImage = (product: Product): string | null => {
    if (product.main_image) {
      return product.main_image
    }

    if (product.images && product.images.length > 0) {
      const primary = product.images.find((img) => img.is_main)
      return (primary ?? product.images[0]).image_url
    }

    return null
  }

  const getCategoryLabel = (product: Product): string => {
    if (product.categories && product.categories.length > 0) {
      return product.categories.map((category) => category.name).join(', ')
    }

    if (product.category_name) {
      return product.category_name
    }

    return 'Sem categoria'
  }

  const handleToggleStatus = async (id: string, currentStatus: 'draft' | 'active' | 'inactive') => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
    await toggleStatus.mutateAsync({ id, status: newStatus })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto permanentemente?\n\nEsta ação não pode ser desfeita.')) return

    setDeletingId(id)
    try {
      await deleteProduct.mutateAsync(id)
    } catch (error) {
      // Erro já tratado no hook com toast
    } finally {
      setDeletingId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-[#1D1D1D] dark:bg-[#0A0A0A]">
        <Table>
          <TableHeader>
            <TableRow className="dark:border-[#1D1D1D]">
              <TableHead className="dark:text-[#E0E0E0]">Imagem</TableHead>
              <TableHead className="dark:text-[#E0E0E0]">Nome</TableHead>
              <TableHead className="dark:text-[#E0E0E0]">Categoria</TableHead>
              <TableHead className="dark:text-[#E0E0E0]">Preço</TableHead>
              <TableHead className="dark:text-[#E0E0E0]">Estoque</TableHead>
              <TableHead className="dark:text-[#E0E0E0]">Status</TableHead>
              <TableHead className="text-right dark:text-[#E0E0E0]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i} className="dark:border-[#1D1D1D]">
                <TableCell>
                  <div className="h-12 w-12 animate-pulse rounded-lg bg-gray-200 dark:bg-[#1A1A1A]" />
                </TableCell>
                <TableCell>
                  <div className="h-4 w-32 animate-pulse rounded bg-gray-200 dark:bg-[#1A1A1A]" />
                </TableCell>
                <TableCell>
                  <div className="h-4 w-24 animate-pulse rounded bg-gray-200 dark:bg-[#1A1A1A]" />
                </TableCell>
                <TableCell>
                  <div className="h-4 w-20 animate-pulse rounded bg-gray-200 dark:bg-[#1A1A1A]" />
                </TableCell>
                <TableCell>
                  <div className="h-4 w-16 animate-pulse rounded bg-gray-200 dark:bg-[#1A1A1A]" />
                </TableCell>
                <TableCell>
                  <div className="h-6 w-16 animate-pulse rounded-full bg-gray-200 dark:bg-[#1A1A1A]" />
                </TableCell>
                <TableCell className="text-right">
                  <div className="ml-auto h-8 w-8 animate-pulse rounded bg-gray-200 dark:bg-[#1A1A1A]" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm dark:border-[#1D1D1D] dark:bg-[#0A0A0A]">
        <p className="text-sm font-medium text-gray-500 dark:text-[#CCCCCC]">Nenhum produto encontrado</p>
        <p className="mt-1 text-xs text-gray-400 dark:text-[#B5B5B5]">
          Tente ajustar os filtros ou criar um novo produto
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-[#1D1D1D] dark:bg-[#0A0A0A]">
      <Table>
        <TableHeader>
          <TableRow className="dark:border-[#1D1D1D] hover:bg-transparent">
            <TableHead className="w-20 dark:text-[#E0E0E0]">Imagem</TableHead>
            <TableHead className="dark:text-[#E0E0E0]">Nome</TableHead>
            <TableHead className="dark:text-[#E0E0E0]">Categoria</TableHead>
            <TableHead className="dark:text-[#E0E0E0]">Preço</TableHead>
            <TableHead className="dark:text-[#E0E0E0]">Estoque</TableHead>
            <TableHead className="dark:text-[#E0E0E0]">Status</TableHead>
            <TableHead className="text-right dark:text-[#E0E0E0]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <ProductTableRow
              key={product.id}
              product={product}
              getMainImage={getMainImage}
              getCategoryLabel={getCategoryLabel}
              handleToggleStatus={handleToggleStatus}
              handleDelete={handleDelete}
              deletingId={deletingId}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

interface ProductTableRowProps {
  product: Product
  getMainImage: (product: Product) => string | null
  getCategoryLabel: (product: Product) => string
  handleToggleStatus: (id: string, currentStatus: 'draft' | 'active' | 'inactive') => void
  handleDelete: (id: string) => void
  deletingId: string | null
}

function ProductTableRow({
  product,
  getMainImage,
  getCategoryLabel,
  handleToggleStatus,
  handleDelete,
  deletingId
}: ProductTableRowProps) {
  // Buscar estoque do produto (sem variante específica para pegar o total)
  const { data: stockData } = useProductStock(product.id, undefined)

  // Calcular estoque total (soma de todas as variantes + produto base)
  const totalStock = stockData?.stocks
    ? stockData.stocks.reduce((sum, stock) => sum + stock.current_stock, 0)
    : stockData?.stock?.current_stock ?? 0

  return (
    <TableRow className="dark:border-[#1D1D1D] dark:hover:bg-[#1A1A1A] even:dark:bg-[#111111]/30">
      <TableCell>
        {(() => {
          const mainImage = getMainImage(product)

          if (!mainImage) {
            return (
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 dark:bg-[#111111]">
                <span className="text-xs font-medium text-gray-400 dark:text-[#777777]">
                  {product.name.slice(0, 2).toUpperCase()}
                </span>
              </div>
            )
          }

          return (
            <div className="relative h-12 w-12 overflow-hidden rounded-lg">
              {mainImage.startsWith('data:') ? (
                <img src={mainImage} alt={product.name} className="h-full w-full object-cover" />
              ) : (
                <Image
                  src={mainImage}
                  alt={product.name}
                  fill
                  className="object-cover"
                  unoptimized={mainImage.startsWith('http://localhost')}
                />
              )}
            </div>
          )
        })()}
      </TableCell>
      <TableCell>
        <div>
          <p className="font-medium text-gray-900 dark:text-white">{product.name}</p>
          {product.slug && (
            <p className="text-xs text-gray-500 dark:text-[#B5B5B5]">{product.slug}</p>
          )}
        </div>
      </TableCell>
      <TableCell>
        <span className="text-sm text-gray-600 dark:text-[#B5B5B5]">{getCategoryLabel(product)}</span>
      </TableCell>
      <TableCell>
        <span className="font-medium text-gray-900 dark:text-white">
          {currencyFormatter.format(parseFloat(product.base_price))}
        </span>
      </TableCell>
      <TableCell>
        <span className="text-sm text-gray-600 dark:text-[#B5B5B5]">{totalStock} unidades</span>
      </TableCell>
      <TableCell>
        <Badge
          variant={
            product.status === 'active'
              ? 'success'
              : product.status === 'draft'
                ? 'secondary'
                : 'secondary'
          }
        >
          {product.status === 'active'
            ? 'Ativo'
            : product.status === 'draft'
              ? 'Rascunho'
              : 'Inativo'}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              disabled={deletingId === product.id}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem asChild>
              <Link
                href={`/products/${product.id}`}
                className="flex w-full cursor-pointer items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Editar
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleToggleStatus(product.id, product.status)}
              className="cursor-pointer"
            >
              {product.status === 'active' ? (
                <>
                  <EyeOff className="mr-2 h-4 w-4" />
                  Desativar
                </>
              ) : (
                <>
                  <Eye className="mr-2 h-4 w-4" />
                  Ativar
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleDelete(product.id)}
              className="cursor-pointer text-rose-600 focus:text-rose-600"
              disabled={deletingId === product.id}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {deletingId === product.id ? 'Excluindo...' : 'Excluir'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  )
}

