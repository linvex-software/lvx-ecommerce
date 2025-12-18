'use client'

import { useState } from 'react'
import { X, Calendar } from 'lucide-react'
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
import { PageHeader } from '@/components/ui/page-header'
import { usePhysicalSales, usePhysicalSalesReport } from '@/lib/hooks/use-physical-sales'
import { useUsers } from '@/lib/hooks/use-users'

export default function PhysicalSalesPage() {
  const [filters, setFilters] = useState<{
    start_date?: string
    end_date?: string
    seller_id?: string
  }>({})

  const { data: salesData, isLoading } = usePhysicalSales({ ...filters, limit: 50 })
  const { data: usersData } = useUsers()
  const { data: report } = usePhysicalSalesReport(filters)

  // Filtrar apenas vendedores
  const sellers = usersData?.users.filter(user => user.role === 'vendedor') || []

  const formatCurrency = (cents: number | string | undefined) => {
    if (!cents) return 'R$ 0,00'
    const value = typeof cents === 'string' ? Number.parseFloat(cents) : cents
    if (isNaN(value)) return 'R$ 0,00'
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value / 100)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const hasActiveFilters = filters.start_date || filters.end_date || filters.seller_id

  const handleClearFilters = () => {
    setFilters({})
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Vendas físicas"
        description="Gerencie as vendas realizadas na loja física"
      />

      {/* Filtros */}
      <Card className="dark:bg-[#0A0A0A] dark:border-[#1D1D1D]">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="sm:w-44">
              <Label className="mb-2 block text-xs font-semibold uppercase tracking-[0.35em] text-gray-400 dark:text-[#CCCCCC]">
                Data inicial
              </Label>
              <div className="relative">
                <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-[#777777]" />
                <Input
                  type="date"
                  value={filters.start_date || ''}
                  onChange={(e) => setFilters({ ...filters, start_date: e.target.value || undefined })}
                  className="pl-10 dark:bg-[#111111] dark:border-[#2A2A2A] dark:text-white dark:hover:border-[#3A3A3A] dark:placeholder:text-[#777777]"
                  placeholder="dd/mm/aaaa"
                />
              </div>
            </div>

            <div className="sm:w-44">
              <Label className="mb-2 block text-xs font-semibold uppercase tracking-[0.35em] text-gray-400 dark:text-[#CCCCCC]">
                Data final
              </Label>
              <div className="relative">
                <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-[#777777]" />
                <Input
                  type="date"
                  value={filters.end_date || ''}
                  onChange={(e) => setFilters({ ...filters, end_date: e.target.value || undefined })}
                  min={filters.start_date}
                  className="pl-10 dark:bg-[#111111] dark:border-[#2A2A2A] dark:text-white dark:hover:border-[#3A3A3A] dark:placeholder:text-[#777777]"
                />
              </div>
            </div>

            <div className="sm:w-56">
              <Label className="mb-2 block text-xs font-semibold uppercase tracking-[0.35em] text-gray-400 dark:text-[#CCCCCC]">
                Filtrar por vendedor
              </Label>
              <select
                value={filters.seller_id || ''}
                onChange={(e) => 
                  setFilters({ 
                    ...filters, 
                    seller_id: e.target.value || undefined 
                  })
                }
                className="flex h-11 w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm ring-offset-white placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#111111] dark:border-[#2A2A2A] dark:text-white dark:placeholder:text-[#777777] dark:hover:border-[#3A3A3A] dark:ring-offset-black"
              >
                <option value="">Todos os vendedores</option>
                {sellers.map((seller) => (
                  <option key={seller.id} value={seller.id}>
                    {seller.name} {seller.email && `(${seller.email})`}
                  </option>
                ))}
              </select>
            </div>

            {hasActiveFilters && (
              <Button
                variant="outline"
                onClick={handleClearFilters}
                className="gap-2 dark:bg-[#111111] dark:border-[#2A2A2A] dark:text-white dark:hover:bg-[#1A1A1A]"
              >
                <X className="h-4 w-4" />
                Limpar filtros
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Relatório por produto */}
      {report && report.report && report.report.length > 0 && (
        <Card className="dark:bg-[#0A0A0A] dark:border-[#1D1D1D]">
          <CardHeader>
            <CardTitle className="text-xl font-semibold dark:text-white">Relatório por produto</CardTitle>
            <CardDescription className="dark:text-[#B5B5B5]">
              Vendas agrupadas por produto no período selecionado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white dark:border-[#1D1D1D] dark:bg-[#0E0E0E]">
              <Table>
                <TableHeader>
                  <TableRow className="dark:border-[#1D1D1D] hover:bg-transparent dark:bg-[#0A0A0A]">
                    <TableHead className="dark:text-[#E0E0E0]">Produto</TableHead>
                    <TableHead className="text-right dark:text-[#E0E0E0]">Quantidade</TableHead>
                    <TableHead className="text-right dark:text-[#E0E0E0]">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.report.map((item: any) => {
                    const totalAmount = typeof item.total_amount === 'string'
                      ? Number.parseFloat(item.total_amount)
                      : typeof item.total_amount === 'number'
                      ? item.total_amount
                      : 0

                    return (
                      <TableRow 
                        key={item.product_id} 
                        className="dark:border-[#1D1D1D] dark:hover:bg-[#1A1A1A] even:dark:bg-[#111111]/30"
                      >
                        <TableCell className="font-medium text-gray-900 dark:text-white">
                          {item.product_name}
                        </TableCell>
                        <TableCell className="text-right text-gray-600 dark:text-[#B5B5B5]">
                          {item.total_quantity}
                        </TableCell>
                        <TableCell className="text-right font-medium text-gray-900 dark:text-white">
                          {formatCurrency(totalAmount)}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de vendas */}
      <Card className="dark:bg-[#0A0A0A] dark:border-[#1D1D1D]">
        <CardHeader>
          <CardTitle className="text-xl font-semibold dark:text-white">Vendas realizadas</CardTitle>
          <CardDescription className="dark:text-[#B5B5B5]">
            Lista completa de vendas físicas realizadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="rounded-lg border border-gray-200 p-12 text-center dark:border-[#1D1D1D] dark:bg-[#0E0E0E]">
              <p className="text-sm text-gray-500 dark:text-[#B5B5B5]">Carregando...</p>
            </div>
          ) : salesData?.sales.length === 0 ? (
            <div className="rounded-lg border border-gray-200 p-12 text-center dark:border-[#1D1D1D] dark:bg-[#0E0E0E]">
              <p className="text-sm font-medium text-gray-500 dark:text-[#CCCCCC]">Nenhuma venda encontrada</p>
              <p className="mt-1 text-xs text-gray-400 dark:text-[#B5B5B5]">
                Ajuste os filtros ou aguarde novas vendas
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white dark:border-[#1D1D1D] dark:bg-[#0E0E0E]">
                <Table>
                  <TableHeader>
                    <TableRow className="dark:border-[#1D1D1D] hover:bg-transparent dark:bg-[#0A0A0A]">
                      <TableHead className="dark:text-[#E0E0E0]">Data</TableHead>
                      <TableHead className="dark:text-[#E0E0E0]">Produto</TableHead>
                      <TableHead className="text-right dark:text-[#E0E0E0]">Qtd</TableHead>
                      <TableHead className="text-right dark:text-[#E0E0E0]">Subtotal</TableHead>
                      <TableHead className="text-right dark:text-[#E0E0E0]">Desconto</TableHead>
                      <TableHead className="text-right dark:text-[#E0E0E0]">Total</TableHead>
                      <TableHead className="dark:text-[#E0E0E0]">Vendedor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salesData?.sales.map((sale) => {
                      const totalValue = typeof sale.total === 'string' 
                        ? Number.parseFloat(sale.total) 
                        : typeof sale.total === 'number' 
                        ? sale.total 
                        : 0
                      
                      const subtotalValue = typeof sale.subtotal === 'string'
                        ? Number.parseFloat(sale.subtotal)
                        : typeof sale.subtotal === 'number'
                        ? sale.subtotal
                        : 0
                      
                      const discountValue = typeof sale.discount === 'string'
                        ? Number.parseFloat(sale.discount)
                        : typeof sale.discount === 'number'
                        ? sale.discount
                        : 0

                      return (
                        <TableRow 
                          key={sale.id} 
                          className="dark:border-[#1D1D1D] dark:hover:bg-[#1A1A1A] even:dark:bg-[#111111]/30"
                        >
                          <TableCell className="text-sm text-gray-600 dark:text-[#B5B5B5]">
                            {formatDate(sale.created_at)}
                          </TableCell>
                          <TableCell className="font-medium text-gray-900 dark:text-white">
                            {sale.product.name}
                          </TableCell>
                          <TableCell className="text-right text-gray-600 dark:text-[#B5B5B5]">
                            {sale.quantity}
                          </TableCell>
                          <TableCell className="text-right text-gray-600 dark:text-[#B5B5B5]">
                            {formatCurrency(subtotalValue)}
                          </TableCell>
                          <TableCell className="text-right text-gray-600 dark:text-[#B5B5B5]">
                            {formatCurrency(discountValue)}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-gray-900 dark:text-white">
                            {formatCurrency(totalValue)}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600 dark:text-[#B5B5B5]">
                            {sale.seller?.name || '-'}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
              {salesData && (
                <div className="mt-4 text-sm text-text-secondary dark:text-[#B5B5B5]">
                  Total: {salesData.total} {salesData.total === 1 ? 'venda' : 'vendas'}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
