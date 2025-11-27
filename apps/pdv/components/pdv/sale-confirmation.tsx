'use client'

import { CheckCircle2, X } from 'lucide-react'
import { Button } from '@white-label/ui'
import type { PhysicalSale } from '@/lib/hooks/use-physical-sales'
import { useAuthStore } from '@/store/auth-store'

interface SaleConfirmationProps {
  sale: PhysicalSale | null
  onClose: () => void
}

export function SaleConfirmation({ sale, onClose }: SaleConfirmationProps) {
  const user = useAuthStore((state) => state.user)

  if (!sale) return null

  const formatCurrency = (cents: number | string) => {
    const value = typeof cents === 'string' ? Number.parseFloat(cents) : cents
    if (isNaN(value)) return 'R$ 0,00'
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value / 100)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
          <h2 className="text-lg font-semibold text-gray-900">Venda Registrada</h2>
          <button 
            onClick={onClose} 
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-6">
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-50 border-4 border-green-100">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">Venda realizada com sucesso!</h3>
            <p className="mt-2 text-sm text-gray-500">A venda foi registrada no sistema</p>
          </div>

          <div className="space-y-3 rounded-xl border border-gray-100 bg-gray-50 p-5">
            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold uppercase tracking-[0.35em] text-gray-400">Produto</span>
              <span className="text-sm font-semibold text-gray-900 text-right max-w-[60%]">{sale.product.name}</span>
            </div>
            <div className="flex justify-between items-center border-t border-gray-200 pt-3">
              <span className="text-xs font-semibold uppercase tracking-[0.35em] text-gray-400">Quantidade</span>
              <span className="text-base font-bold text-gray-900">{sale.quantity}</span>
            </div>
            {sale.subtotal && (
              <div className="flex justify-between items-center border-t border-gray-200 pt-3">
                <span className="text-xs font-semibold uppercase tracking-[0.35em] text-gray-400">Subtotal</span>
                <span className="text-base font-semibold text-gray-900">
                  {formatCurrency(
                    typeof sale.subtotal === 'string' 
                      ? Number.parseFloat(sale.subtotal) 
                      : sale.subtotal
                  )}
                </span>
              </div>
            )}
            {sale.discount && (typeof sale.discount === 'number' ? sale.discount > 0 : Number.parseFloat(String(sale.discount)) > 0) && (
              <div className="flex justify-between items-center border-t border-gray-200 pt-3">
                <span className="text-xs font-semibold uppercase tracking-[0.35em] text-gray-400">Desconto</span>
                <span className="text-base font-semibold text-green-600">
                  -{formatCurrency(
                    typeof sale.discount === 'string' 
                      ? Number.parseFloat(sale.discount) 
                      : sale.discount
                  )}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center border-t-2 border-gray-300 pt-3">
              <span className="text-sm font-bold uppercase tracking-[0.35em] text-gray-700">Total</span>
              <span className="text-2xl font-bold text-gray-900">{formatCurrency(sale.total)}</span>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-gray-200 bg-white p-5">
            <div className="text-xs font-semibold uppercase tracking-[0.35em] text-gray-400 mb-3">Vendedor</div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-900 text-white font-bold">
                {user?.name?.charAt(0) || '?'}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{user?.name || 'N/A'}</p>
                <p className="text-xs text-gray-500">ID: {user?.id || 'N/A'}</p>
              </div>
            </div>
          </div>

          <div className="mt-3 rounded-xl border border-gray-200 bg-white p-5">
            <div className="text-xs font-semibold uppercase tracking-[0.35em] text-gray-400 mb-3">ID da Venda</div>
            <p className="font-mono text-sm font-semibold text-gray-900 break-all">{sale.id}</p>
          </div>
        </div>

        <div className="border-t border-gray-200 px-6 py-5">
          <Button onClick={onClose} className="w-full h-12 text-base font-semibold">
            Fechar
          </Button>
        </div>
      </div>
    </div>
  )
}

