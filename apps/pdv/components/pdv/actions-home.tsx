'use client'

import { Search, User, Percent, ShoppingCart } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@white-label/ui'
import { cn } from '@/lib/utils'
import { useActivePdvCart } from '@/lib/hooks/use-pdv-cart'

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
  const { data: activeCart } = useActivePdvCart()

  const actions: ActionCard[] = [
    {
      id: 'select-customer',
      title: 'Selecionar cliente',
      icon: <User className="h-6 w-6" />,
      onClick: () => onSelectAction('select-customer')
    },
    {
      id: 'search-products',
      title: 'Buscar produtos',
      icon: <Search className="h-6 w-6" />,
      onClick: () => onSelectAction('search-products')
    },
    {
      id: 'apply-discount',
      title: 'Aplicar desconto',
      icon: <Percent className="h-6 w-6" />,
      onClick: () => onSelectAction('apply-discount')
    }
  ]

  const hasItems = activeCart && activeCart.items.length > 0

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Ponto de Venda</h1>
        <p className="text-gray-600">Inicie uma nova venda</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
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

      {hasItems && (
        <div className="mt-8 text-center">
          <Button
            onClick={() => onSelectAction('go-to-cart')}
            className="bg-blue-600 hover:bg-blue-700 text-white h-12 px-8 text-base font-semibold"
            size="lg"
          >
            <ShoppingCart className="h-5 w-5 mr-2" />
            Ir para o carrinho ({activeCart.items.length} {activeCart.items.length === 1 ? 'item' : 'itens'})
          </Button>
        </div>
      )}
    </div>
  )
}

