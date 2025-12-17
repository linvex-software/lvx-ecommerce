'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Package, TrendingUp, TrendingDown, Edit, AlertCircle } from 'lucide-react'
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
  productName?: string
  productIdForEdit?: string
}

export function StockManager({ productId, variants = [], productName, productIdForEdit }: StockManagerProps) {
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null)
  const [movementType, setMovementType] = useState<'IN' | 'OUT'>('IN')
  const [selectedVariantForMovement, setSelectedVariantForMovement] = useState<string | null>(null)
  const [quantity, setQuantity] = useState('')
  const [reason, setReason] = useState('')

  const { data: stockData, isLoading } = useProductStock(productId, selectedVariant || undefined)
  const createMovement = useCreateStockMovement(productId)

  const stocks: StockInfo[] = stockData?.stocks || (stockData?.stock ? [stockData.stock] : [])

  // Calcular resumo do estoque
  const stockSummary = useMemo(() => {
    const totalStock = stocks.reduce((sum, stock) => sum + stock.current_stock, 0)
    const variantsWithStock = stocks.filter(stock => stock.current_stock > 0).length
    const totalVariants = stocks.length
    const isZeroStock = totalStock === 0

    return {
      totalStock,
      variantsWithStock,
      totalVariants,
      isZeroStock
    }
  }, [stocks])

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

    // Para produtos sem variações, sempre usar null como variant_id
    const finalVariantId = hasVariants ? selectedVariantForMovement : null

    // Verificar se é saída e se há estoque suficiente
    if (movementType === 'OUT') {
      const targetStock = stocks.find(s =>
        (finalVariantId === null && s.variant_id === null) ||
        (finalVariantId !== null && s.variant_id === finalVariantId)
      )

      if (targetStock && quantityValue > targetStock.current_stock) {
        const confirmed = window.confirm(
          `A quantidade informada (${quantityValue}) é maior que o estoque atual (${targetStock.current_stock} unidades). Deseja continuar mesmo assim?`
        )
        if (!confirmed) return
      }
    }

    const movementData: CreateStockMovementInput = {
      variant_id: finalVariantId,
      type: movementType,
      origin: 'manual',
      quantity: quantityValue,
      reason: reason.trim() || null
    }

    try {
      await createMovement.mutateAsync(movementData)
      setQuantity('')
      setReason('')
      setSelectedVariantForMovement(null)
      toast.success('Movimentação criada com sucesso!', {
        description: movementType === 'IN'
          ? `${quantityValue} unidade(s) adicionada(s) ao estoque.`
          : `${quantityValue} unidade(s) removida(s) do estoque.`
      })
    } catch (error: any) {
      console.error('Erro ao criar movimento:', error)
      toast.error('Erro ao criar movimentação', {
        description: error?.response?.data?.error || 'Não foi possível criar a movimentação. Tente novamente.'
      })
    }
  }

  const getVariantName = (variantId: string | null) => {
    if (!variantId) return 'Produto base'
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

  const getVariantDisplayName = (variant: ProductVariant, idx: number) => {
    const parts = []
    if (variant.size) parts.push(variant.size)
    if (variant.color) parts.push(variant.color)
    return parts.length > 0 ? parts.join(' - ') : `Variante ${idx + 1}`
  }

  const hasVariants = variants.length > 0
  const isFormValid = quantity && parseInt(quantity, 10) > 0 && (hasVariants ? selectedVariantForMovement !== null : true)

  // Para produtos sem variações, sempre usar null como variant_id
  const finalVariantId = hasVariants ? selectedVariantForMovement : null

  return (
    <div className="space-y-6">
      {/* Bloco 1: Resumo do estoque */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="dark:bg-[#0E0E0E] dark:border-[#1D1D1D]">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary dark:text-[#B5B5B5]">Estoque total</p>
                <p className="mt-1 text-2xl font-semibold text-text-primary dark:text-white">
                  {stockSummary.totalStock.toLocaleString('pt-BR')}
                </p>
                <p className="mt-1 text-xs text-text-tertiary dark:text-[#777777]">unidades</p>
              </div>
              <Package className="h-8 w-8 text-text-tertiary dark:text-[#777777]" />
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-[#0E0E0E] dark:border-[#1D1D1D]">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary dark:text-[#B5B5B5]">Variações com estoque</p>
                <p className="mt-1 text-2xl font-semibold text-text-primary dark:text-white">
                  {stockSummary.variantsWithStock}
                </p>
                <p className="mt-1 text-xs text-text-tertiary dark:text-[#777777]">
                  de {stockSummary.totalVariants} variações
                </p>
              </div>
              <Package className="h-8 w-8 text-text-tertiary dark:text-[#777777]" />
            </div>
          </CardContent>
        </Card>

        <Card className={`dark:bg-[#0E0E0E] dark:border-[#1D1D1D] ${stockSummary.isZeroStock ? 'border-amber-200 dark:border-amber-900/50' : ''}`}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary dark:text-[#B5B5B5]">Status</p>
                {stockSummary.isZeroStock ? (
                  <>
                    <Badge variant="error" className="mt-1">
                      Estoque zerado
                    </Badge>
                    <p className="mt-1 text-xs text-text-tertiary dark:text-[#777777]">
                      Adicione unidades
                    </p>
                  </>
                ) : (
                  <>
                    <Badge variant="success" className="mt-1">
                      Em estoque
                    </Badge>
                    <p className="mt-1 text-xs text-text-tertiary dark:text-[#777777]">
                      Produto disponível
                    </p>
                  </>
                )}
              </div>
              {stockSummary.isZeroStock && (
                <AlertCircle className="h-8 w-8 text-amber-500 dark:text-amber-400" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bloco 2: Filtrar e ver variantes */}
      <Card className="dark:bg-[#0E0E0E] dark:border-[#1D1D1D]">
        <CardHeader>
          <CardTitle className="text-xl font-semibold dark:text-white">Estoque por variação</CardTitle>
          <CardDescription className="dark:text-[#B5B5B5]">
            Veja o estoque atual para cada variação deste produto.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filtro de variante */}
          <div className="space-y-2">
            <Label htmlFor="variant-filter" className="dark:text-[#CCCCCC]">Filtrar por variação</Label>
            <select
              id="variant-filter"
              value={selectedVariant || ''}
              onChange={(e) => setSelectedVariant(e.target.value || null)}
              className="flex h-11 w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm ring-offset-white placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#111111] dark:border-[#2A2A2A] dark:text-white dark:placeholder:text-[#777777] dark:hover:border-[#3A3A3A] dark:ring-offset-black"
            >
              <option value="">Todas as variações</option>
              {variants.map((variant, idx) => (
                <option key={idx} value={(variant as any).id || `temp-${idx}`}>
                  {getVariantDisplayName(variant, idx)}
                </option>
              ))}
            </select>
          </div>

          {/* Tabela de estoque */}
          {isLoading ? (
            <div className="rounded-lg border border-gray-200 p-6 text-center dark:border-[#1D1D1D] dark:bg-[#101010]">
              <p className="text-sm text-gray-500 dark:text-[#B5B5B5]">Carregando estoque...</p>
            </div>
          ) : stocks.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center dark:border-[#2A2A2A] dark:bg-[#101010]">
              <Package className="mx-auto h-8 w-8 text-gray-400 dark:text-[#777777]" />
              <p className="mt-2 text-sm text-gray-500 dark:text-[#CCCCCC]">Nenhum estoque registrado</p>
              <p className="mt-1 text-xs text-gray-400 dark:text-[#B5B5B5]">
                Crie uma entrada de estoque para começar
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white dark:border-[#1D1D1D] dark:bg-[#101010]">
              <Table>
                <TableHeader>
                  <TableRow className="dark:border-[#1D1D1D] hover:bg-transparent dark:bg-[#0A0A0A]">
                    <TableHead className="dark:text-[#E0E0E0]">Variação</TableHead>
                    <TableHead className="text-right dark:text-[#E0E0E0]">Estoque atual</TableHead>
                    <TableHead className="dark:text-[#E0E0E0]">Última movimentação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stocks.map((stock, idx) => {
                    const stockValue = stock.current_stock
                    const isSelected = selectedVariant
                      ? (selectedVariant === stock.variant_id || (selectedVariant === '' && stock.variant_id === null))
                      : false

                    return (
                      <TableRow
                        key={idx}
                        className={`dark:border-[#1D1D1D] dark:hover:bg-[#1A1A1A] even:dark:bg-[#111111]/30 ${
                          isSelected ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                        }`}
                      >
                        <TableCell className="font-medium text-gray-900 dark:text-white">
                          {getVariantName(stock.variant_id)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge
                            variant={stockValue === 0 ? 'secondary' : 'success'}
                            className="text-sm font-semibold px-2.5 py-0.5"
                          >
                            {stockValue.toLocaleString('pt-BR')} {stockValue === 1 ? 'unidade' : 'unidades'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600 dark:text-[#B5B5B5]">
                          {stock.last_movement_at ? (
                            <span>
                              {new Date(stock.last_movement_at).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric'
                              })}
                            </span>
                          ) : (
                            <span className="text-gray-400 dark:text-[#777777]">Nunca</span>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bloco 3: Nova movimentação de estoque */}
      <Card className="dark:bg-[#0E0E0E] dark:border-[#1D1D1D]">
        <CardHeader>
          <CardTitle className="text-xl font-semibold dark:text-white">Nova movimentação</CardTitle>
          <CardDescription className="dark:text-[#B5B5B5]">
            Adicione ou remova unidades do estoque deste produto.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="movement-type" className="dark:text-[#CCCCCC]">
              Tipo de movimentação *
            </Label>
            <select
              id="movement-type"
              value={movementType}
              onChange={(e) => {
                setMovementType(e.target.value as 'IN' | 'OUT')
                setQuantity('')
              }}
              className="flex h-11 w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm ring-offset-white placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#111111] dark:border-[#2A2A2A] dark:text-white dark:placeholder:text-[#777777] dark:hover:border-[#3A3A3A] dark:ring-offset-black"
            >
              <option value="IN">Entrada de estoque</option>
              <option value="OUT">Saída de estoque</option>
            </select>
            <p className="text-xs text-text-secondary dark:text-[#B5B5B5]">
              {movementType === 'IN'
                ? 'Entrada aumenta o estoque (ex.: compra de fornecedor, acerto).'
                : 'Saída reduz o estoque (ex.: ajuste, perda, uso interno).'}
            </p>
          </div>

          {hasVariants && (
            <div className="space-y-2">
              <Label htmlFor="movement-variant" className="dark:text-[#CCCCCC]">
                Variação *
              </Label>
              <select
                id="movement-variant"
                value={selectedVariantForMovement || ''}
                onChange={(e) => setSelectedVariantForMovement(e.target.value || null)}
                className="flex h-11 w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm ring-offset-white placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#111111] dark:border-[#2A2A2A] dark:text-white dark:placeholder:text-[#777777] dark:hover:border-[#3A3A3A] dark:ring-offset-black"
              >
                <option value="">Selecione qual variação será ajustada</option>
                {variants.map((variant, idx) => (
                  <option key={idx} value={(variant as any).id || `temp-${idx}`}>
                    {getVariantDisplayName(variant, idx)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {!hasVariants && (
            <div className="space-y-2">
              <Label className="dark:text-[#CCCCCC]">Variação</Label>
              <div className="flex h-11 items-center rounded-lg border border-gray-200 bg-gray-50 px-4 text-sm dark:bg-[#111111] dark:border-[#2A2A2A] dark:text-white">
                Produto base
              </div>
              <p className="text-xs text-text-secondary dark:text-[#B5B5B5]">
                Este produto não possui variações. O ajuste será aplicado ao produto inteiro.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="movement-quantity" className="dark:text-[#CCCCCC]">
              Quantidade *
            </Label>
            <Input
              id="movement-quantity"
              type="number"
              min="1"
              step="1"
              placeholder="Ex: 10"
              value={quantity}
              onChange={(e) => {
                const value = e.target.value
                if (value === '' || (/^\d+$/.test(value) && parseInt(value, 10) > 0)) {
                  setQuantity(value)
                }
              }}
              className="text-base dark:bg-[#111111] dark:border-[#2A2A2A] dark:text-white dark:placeholder:text-[#777777] dark:hover:border-[#3A3A3A]"
            />
            <p className="text-xs text-text-secondary dark:text-[#B5B5B5]">
              Digite apenas números inteiros. Use o tipo de movimentação para indicar se é entrada ou saída.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="movement-reason" className="dark:text-[#CCCCCC]">
              Motivo (opcional)
            </Label>
            <Input
              id="movement-reason"
              placeholder="Ex: Entrada de estoque inicial, compra de fornecedor, ajuste de inventário..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={500}
              className="dark:bg-[#111111] dark:border-[#2A2A2A] dark:text-white dark:placeholder:text-[#777777] dark:hover:border-[#3A3A3A]"
            />
            <p className="text-xs text-text-secondary dark:text-[#B5B5B5]">
              {reason.length}/500 caracteres
            </p>
          </div>

          <Button
            type="button"
            onClick={handleCreateMovement}
            disabled={createMovement.isPending || !isFormValid}
            className="w-full gap-2"
          >
            {createMovement.isPending ? (
              <>
                <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Processando...
              </>
            ) : movementType === 'IN' ? (
              <>
                <TrendingUp className="h-4 w-4" />
                Adicionar ao estoque
              </>
            ) : (
              <>
                <TrendingDown className="h-4 w-4" />
                Remover do estoque
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
