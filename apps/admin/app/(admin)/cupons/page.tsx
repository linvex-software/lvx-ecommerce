'use client'

import { useState } from 'react'
import { Plus, Filter } from 'lucide-react'
import { Button } from '@white-label/ui'
import { CouponTable } from '@/components/coupons/coupon-table'
import { CouponForm } from '@/components/coupons/coupon-form'
import { useCoupons, type Coupon } from '@/lib/hooks/use-coupons'
import { useCreateCoupon } from '@/lib/hooks/use-create-coupon'
import { useUpdateCoupon } from '@/lib/hooks/use-update-coupon'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type FilterStatus = 'all' | 'active' | 'inactive'

export default function CuponsPage() {
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('active')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null)

  // Query params baseados no filtro
  const queryParams = filterStatus === 'all' ? undefined : { active: filterStatus === 'active' }
  const { data: coupons = [], isLoading } = useCoupons(queryParams)

  const createCoupon = useCreateCoupon()
  const updateCoupon = useUpdateCoupon(editingCoupon?.id || '')

  const handleCreate = async (data: any) => {
    try {
      await createCoupon.mutateAsync(data)
      setIsDialogOpen(false)
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erro ao criar cupom')
    }
  }

  const handleUpdate = async (data: any) => {
    if (!editingCoupon) return

    try {
      await updateCoupon.mutateAsync(data)
      setIsDialogOpen(false)
      setEditingCoupon(null)
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erro ao atualizar cupom')
    }
  }

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon)
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingCoupon(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cupons de Desconto</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie cupons promocionais para sua loja
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Cupom
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-4 p-4 border rounded-lg bg-card">
        <Filter className="h-5 w-5 text-muted-foreground" />
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Status:</span>
          <Select
            value={filterStatus}
            onValueChange={(value) => setFilterStatus(value as FilterStatus)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Ativos</SelectItem>
              <SelectItem value="inactive">Inativos</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="ml-auto text-sm text-muted-foreground">
          {coupons.length} {coupons.length === 1 ? 'cupom' : 'cupons'}
        </div>
      </div>

      {/* Tabela */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Carregando cupons...</p>
        </div>
      ) : (
        <CouponTable coupons={coupons} onEdit={handleEdit} />
      )}

      {/* Dialog de Criar/Editar */}
      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCoupon ? 'Editar Cupom' : 'Criar Novo Cupom'}
            </DialogTitle>
          </DialogHeader>
          <CouponForm
            coupon={editingCoupon}
            onSubmit={editingCoupon ? handleUpdate : handleCreate}
            onCancel={handleCloseDialog}
            isLoading={createCoupon.isPending || updateCoupon.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

