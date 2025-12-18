'use client'

import { useState } from 'react'
import { MoreVertical, Pencil, Trash2, Calendar, Tag, Percent, DollarSign } from 'lucide-react'
import { Button } from '@white-label/ui'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import type { Coupon } from '@/lib/hooks/use-coupons'
import { useDeleteCoupon } from '@/lib/hooks/use-delete-coupon'

interface CouponTableProps {
  coupons: Coupon[]
  onEdit: (coupon: Coupon) => void
}

export function CouponTable({ coupons, onEdit }: CouponTableProps) {
  const deleteCoupon = useDeleteCoupon()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (couponId: string, code: string) => {
    if (!confirm(`Deseja desativar o cupom "${code}"?`)) return

    setDeletingId(couponId)
    try {
      await deleteCoupon.mutateAsync(couponId)
    } catch (error) {
      alert('Erro ao desativar cupom')
    } finally {
      setDeletingId(null)
    }
  }

  const formatValue = (type: string, value: string) => {
    const numValue = parseFloat(value)
    if (type === 'percent') {
      return `${numValue}%`
    }
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(numValue / 100) // valor em centavos
  }

  const formatMinValue = (minValue: string | null) => {
    if (!minValue) return '-'
    const numValue = parseFloat(minValue)
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(numValue / 100)
  }

  const formatExpiresAt = (expiresAt: string | null) => {
    if (!expiresAt) return 'Sem expiração'
    
    const date = new Date(expiresAt)
    const now = new Date()
    const isPast = date < now
    
    // Sempre mostrar a data formatada
    const formattedDate = date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
    
    if (isPast) {
      return <span className="text-red-600">Expirado ({formattedDate})</span>
    }
    
    return <span className="text-muted-foreground">{formattedDate}</span>
  }

  if (coupons.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Tag className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Nenhum cupom encontrado</p>
      </div>
    )
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Código</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Pedido Mínimo</TableHead>
            <TableHead>Usos</TableHead>
            <TableHead>Validade</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[100px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {coupons.map((coupon) => (
            <TableRow key={coupon.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <span className="font-mono font-bold">{coupon.code}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {coupon.type === 'percent' ? (
                    <>
                      <Percent className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">Percentual</span>
                    </>
                  ) : (
                    <>
                      <DollarSign className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Valor Fixo</span>
                    </>
                  )}
                </div>
              </TableCell>
              <TableCell className="font-medium">
                {formatValue(coupon.type, coupon.value)}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatMinValue(coupon.min_value)}
              </TableCell>
              <TableCell>
                <span className="text-sm">
                  {coupon.used_count}
                  {coupon.max_uses ? ` / ${coupon.max_uses}` : ' / Sem limite'}
                </span>
              </TableCell>
              <TableCell className="text-sm">
                {formatExpiresAt(coupon.expires_at)}
              </TableCell>
              <TableCell>
                <Badge variant={coupon.active ? 'default' : 'secondary'}>
                  {coupon.active ? 'Ativo' : 'Inativo'}
                </Badge>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="h-8 w-8 p-0"
                      disabled={deletingId === coupon.id}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => onEdit(coupon)}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDelete(coupon.id, coupon.code)}
                      disabled={deletingId === coupon.id}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {deletingId === coupon.id ? 'Desativando...' : 'Desativar'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

