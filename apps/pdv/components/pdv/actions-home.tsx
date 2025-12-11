'use client'

import { Search, User, Percent, Package, FileText, Truck } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@white-label/ui'
import { cn } from '@/lib/utils'

interface ActionCard {
  id: string
  title: string
  icon: React.ReactNode
  onClick: () => void
}

interface ActionsHomeProps {
  onSelectAction: (action: string) => void
}

export function ActionsHome({ onSelectAction }: ActionsHomeProps) {
  const actions: ActionCard[] = [
    {
      id: 'search-products',
      title: 'Buscar produtos',
      icon: <Search className="h-6 w-6" />,
      onClick: () => onSelectAction('search-products')
    },
    {
      id: 'select-customer',
      title: 'Selecionar cliente',
      icon: <User className="h-6 w-6" />,
      onClick: () => onSelectAction('select-customer')
    },
    {
      id: 'apply-discount',
      title: 'Aplicar desconto',
      icon: <Percent className="h-6 w-6" />,
      onClick: () => onSelectAction('apply-discount')
    },
    {
      id: 'create-product',
      title: 'Criar produto',
      icon: <Package className="h-6 w-6" />,
      onClick: () => onSelectAction('create-product')
    },
    {
      id: 'add-note',
      title: 'Adicionar nota',
      icon: <FileText className="h-6 w-6" />,
      onClick: () => onSelectAction('add-note')
    },
    {
      id: 'add-shipping',
      title: 'Adicionar envio',
      icon: <Truck className="h-6 w-6" />,
      onClick: () => onSelectAction('add-shipping')
    }
  ]

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Ponto de Venda</h1>
        <p className="text-gray-600">Selecione uma ação para começar</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {actions.map((action) => (
          <Card
            key={action.id}
            className={cn(
              'cursor-pointer transition-all hover:shadow-md hover:border-gray-300',
              'hover:scale-[1.02]'
            )}
            onClick={action.onClick}
          >
            <CardContent className="p-6 flex flex-col items-center justify-center min-h-[140px]">
              <div className="mb-4 p-3 rounded-full bg-gray-100 text-gray-700">
                {action.icon}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 text-center">{action.title}</h3>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

