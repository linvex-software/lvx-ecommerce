'use client'

import { useState } from 'react'
import { Plus, Package, TrendingUp, TrendingDown } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@white-label/ui'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
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
  const [movementType, setMovementType] = useState<'IN' | 'ADJUST'>('IN')
  const [quantity, setQuantity] = useState('')
  const [reason, setReason] = useState('')

  const { data: stockData, isLoading } = useProductStock(productId, selectedVariant || undefined)
  const createMovement = useCreateStockMovement(productId)

  const stocks: StockInfo[] = stockData?.stocks || (stockData?.stock ? [stockData.stock] : [])

  const handleCreateMovement = async () => {
    // Validações
    if (!quantity || parseFloat(quantity) <= 0) {
      toast.error('Quantidade inválida', {
        description: 'A quantidade deve ser maior que zero.'
      })
      return
    }

    const quantityValue = parseInt(quantity, 10)
    if (isNaN(quantityValue) || quantityValue <= 0) {
      toast.error('Quantidade inválida', {
        description: 'A quantidade deve ser um número inteiro positivo.'
      })
      return
    }

    // Para ajuste, a quantidade informada é o saldo final desejado
    const movementData: CreateStockMovementInput = {
      variant_id: selectedVariant || null,
      type: movementType,
      origin: 'manual',
      quantity: movementType === 'ADJUST' ? 0 : quantityValue, // Para ADJUST, quantity não importa (usa final_quantity)
      reason: reason.trim() || null,
      final_quantity: movementType === 'ADJUST' ? quantityValue : null
    }

    try {
      await createMovement.mutateAsync(movementData)
      setQuantity('')
      setReason('')
      toast.success('Movimentação criada com sucesso!', {
        description: movementType === 'IN' 
          ? `${quantityValue} unidade(s) adicionada(s) ao estoque.`
          : `Estoque ajustado para ${quantityValue} unidade(s).`
      })
    } catch (error: any) {
      console.error('Erro ao criar movimento:', error)
      toast.error('Erro ao criar movimentação', {
        description: error?.response?.data?.error || 'Não foi possível criar a movimentação. Tente novamente.'
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
    <Card className="rounded-xl border-gray-100 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">Estoque</CardTitle>
        <CardDescription className="text-xs">Gerencie o estoque do produto e suas variantes</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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
          <div className="rounded-lg border border-gray-200 p-6 text-center">
            <p className="text-sm text-gray-500">Carregando estoque...</p>
          </div>
        ) : stocks.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center">
            <Package className="mx-auto h-8 w-8 text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">Nenhum estoque registrado</p>
            <p className="mt-1 text-xs text-gray-400">
              Crie uma entrada de estoque para começar
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Variante</TableHead>
                  <TableHead className="text-right">Estoque Atual</TableHead>
                  <TableHead>Última Movimentação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stocks.map((stock, idx) => {
                  const stockValue = stock.current_stock
                  const isLowStock = stockValue === 0
                  const isMediumStock = stockValue > 0 && stockValue < 10
                  
                  return (
                    <TableRow key={idx} className={isLowStock ? 'bg-red-50/50' : ''}>
                      <TableCell className="font-medium text-gray-900">
                        {getVariantName(stock.variant_id)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Badge 
                            variant={isLowStock ? 'destructive' : isMediumStock ? 'secondary' : 'success'}
                            className="text-sm font-semibold px-2.5 py-0.5"
                          >
                            {stockValue.toLocaleString('pt-BR')} {stockValue === 1 ? 'unidade' : 'unidades'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {stock.last_movement_at ? (
                          <div className="flex items-center gap-1">
                            {new Date(stock.last_movement_at).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric'
                            })}
                          </div>
                        ) : (
                          <span className="text-gray-400">Nunca</span>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Formulário de movimentação */}
        <Card className="rounded-lg border-gray-100 bg-gray-50/50 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Nova Movimentação</CardTitle>
            <CardDescription className="text-xs">
              {movementType === 'IN' 
                ? 'Adicione unidades ao estoque do produto'
                : 'Ajuste o estoque para uma quantidade específica'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="movement-type">Tipo de Movimentação *</Label>
              <select
                id="movement-type"
                value={movementType}
                onChange={(e) => {
                  setMovementType(e.target.value as 'IN' | 'ADJUST')
                  setQuantity('') // Limpar quantidade ao mudar tipo
                }}
                className="flex h-11 w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm ring-offset-white placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="IN">Entrada de Estoque</option>
                <option value="ADJUST">Ajuste de Estoque</option>
              </select>
              {movementType === 'ADJUST' && (
                <p className="text-xs text-gray-500 mt-1">
                  💡 <strong>Dica:</strong> Ajuste define o estoque final. Saídas são automáticas via pedidos.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="movement-quantity">
                {movementType === 'IN' ? 'Quantidade a Adicionar *' : 'Quantidade Final Desejada *'}
              </Label>
              <Input
                id="movement-quantity"
                type="number"
                min="0"
                step="1"
                placeholder={movementType === 'IN' ? 'Ex: 100' : 'Ex: 50'}
                value={quantity}
                onChange={(e) => {
                  const value = e.target.value
                  // Permitir apenas números inteiros positivos
                  if (value === '' || (/^\d+$/.test(value) && parseInt(value, 10) >= 0)) {
                    setQuantity(value)
                  }
                }}
                className="text-base"
              />
              {movementType === 'ADJUST' && (
                <p className="text-xs text-gray-500">
                  Informe o estoque final desejado. O sistema calculará a diferença automaticamente.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="movement-reason">Motivo (opcional)</Label>
              <Input
                id="movement-reason"
                placeholder={
                  movementType === 'IN' 
                    ? 'Ex: Entrada de estoque inicial, compra de fornecedor...'
                    : 'Ex: Ajuste de inventário, correção de divergência...'
                }
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                maxLength={500}
              />
              <p className="text-xs text-gray-500">
                {reason.length}/500 caracteres
              </p>
            </div>

            <Button
              type="button"
              onClick={handleCreateMovement}
              disabled={createMovement.isPending || !quantity || parseInt(quantity, 10) <= 0}
              className="w-full gap-2"
            >
              {movementType === 'IN' ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              {createMovement.isPending 
                ? 'Processando...' 
                : movementType === 'IN' 
                  ? 'Adicionar ao Estoque' 
                  : 'Ajustar Estoque'}
            </Button>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  )
}

