'use client'

import { useState } from 'react'
import { Plus, Package } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@white-label/ui'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import {
  useProductStock,
  useCreateStockMovement,
  type StockInfo,
  type CreateStockMovementInput,
  type ProductVariant
} from '@/lib/hooks/use-products'

interface StockManagerProps {
  productId: string
  variants?: ProductVariant[]
}

export function StockManager({ productId, variants = [] }: StockManagerProps) {
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null)
  const [movementType, setMovementType] = useState<'IN' | 'OUT' | 'ADJUST'>('IN')
  const [quantity, setQuantity] = useState('')
  const [reason, setReason] = useState('')
  const [finalQuantity, setFinalQuantity] = useState('')

  const { data: stockData, isLoading } = useProductStock(productId, selectedVariant || undefined)
  const createMovement = useCreateStockMovement(productId)

  const stocks: StockInfo[] = stockData?.stocks || (stockData?.stock ? [stockData.stock] : [])

  const handleCreateMovement = async () => {
    if (!quantity || parseFloat(quantity) <= 0) {
      toast.error('Quantidade inválida', {
        description: 'A quantidade deve ser maior que zero.'
      })
      return
    }

    if (movementType === 'ADJUST' && !finalQuantity) {
      toast.error('Campo obrigatório', {
        description: 'Para ajuste, informe a quantidade final desejada.'
      })
      return
    }

    const movementData: CreateStockMovementInput = {
      variant_id: selectedVariant || null,
      type: movementType,
      origin: 'manual',
      quantity: parseFloat(quantity),
      reason: reason || null,
      final_quantity: finalQuantity ? parseFloat(finalQuantity) : null
    }

    try {
      await createMovement.mutateAsync(movementData)
      setQuantity('')
      setReason('')
      setFinalQuantity('')
      toast.success('Movimentação criada com sucesso!', {
        description: `Estoque ${movementType === 'IN' ? 'adicionado' : movementType === 'OUT' ? 'removido' : 'ajustado'}.`
      })
    } catch (error) {
      console.error('Erro ao criar movimento:', error)
      toast.error('Erro ao criar movimentação', {
        description: 'Não foi possível criar a movimentação. Tente novamente.'
      })
    }
  }

  const getVariantName = (variantId: string | null) => {
    if (!variantId) return 'Produto Base'
    const variant = variants.find((v, idx) => {
      const vId = (v as any).id || `temp-${idx}`
      return vId === variantId
    })
    if (!variant) return 'Variante'
    const parts = []
    if (variant.size) parts.push(`Tamanho: ${variant.size}`)
    if (variant.color) parts.push(`Cor: ${variant.color}`)
    return parts.length > 0 ? parts.join(' | ') : 'Variante'
  }

  return (
    <Card className="rounded-2xl border-gray-100 shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl font-light">Estoque</CardTitle>
        <CardDescription>Gerencie o estoque do produto e suas variantes</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Filtro de variante */}
        <div className="space-y-2">
          <Label htmlFor="variant-filter">Filtrar por variante</Label>
          <select
            id="variant-filter"
            value={selectedVariant || ''}
            onChange={(e) => setSelectedVariant(e.target.value || null)}
            className="flex h-11 w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm ring-offset-white placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">Todas as variantes</option>
            {variants.map((variant, idx) => (
              <option key={idx} value={(variant as any).id || `temp-${idx}`}>
                {variant.size || variant.color
                  ? `${variant.size || ''} ${variant.color || ''}`.trim()
                  : `Variante ${idx + 1}`}
              </option>
            ))}
          </select>
        </div>

        {/* Tabela de estoque */}
        {isLoading ? (
          <div className="rounded-lg border border-gray-200 p-8 text-center">
            <p className="text-sm text-gray-500">Carregando estoque...</p>
          </div>
        ) : stocks.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">Nenhum estoque registrado</p>
            <p className="mt-1 text-xs text-gray-400">
              Crie movimentações de estoque para começar
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Variante</TableHead>
                  <TableHead className="text-right">Estoque Atual</TableHead>
                  <TableHead>Última Movimentação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stocks.map((stock, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">
                      {getVariantName(stock.variant_id)}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {stock.current_stock} unidades
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {stock.last_movement_at
                        ? new Date(stock.last_movement_at).toLocaleDateString('pt-BR')
                        : 'Nunca'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Formulário de movimentação */}
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <h4 className="mb-4 font-semibold text-gray-900">Nova Movimentação</h4>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="movement-type">Tipo *</Label>
                <select
                  id="movement-type"
                  value={movementType}
                  onChange={(e) => setMovementType(e.target.value as 'IN' | 'OUT' | 'ADJUST')}
                  className="flex h-11 w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm ring-offset-white placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="IN">Entrada</option>
                  <option value="OUT">Saída</option>
                  <option value="ADJUST">Ajuste</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="movement-quantity">Quantidade *</Label>
                <Input
                  id="movement-quantity"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>
            </div>

            {movementType === 'ADJUST' && (
              <div className="space-y-2">
                <Label htmlFor="final-quantity">Quantidade Final</Label>
                <Input
                  id="final-quantity"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={finalQuantity}
                  onChange={(e) => setFinalQuantity(e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  Define o estoque final desejado (sobrescreve cálculo anterior)
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="movement-reason">Motivo (opcional)</Label>
              <Input
                id="movement-reason"
                placeholder="Ex: Entrada de estoque inicial"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>

            <Button
              type="button"
              onClick={handleCreateMovement}
              disabled={createMovement.isPending || !quantity}
              className="w-full gap-2"
            >
              <Plus className="h-4 w-4" />
              {createMovement.isPending ? 'Criando...' : 'Criar Movimentação'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

