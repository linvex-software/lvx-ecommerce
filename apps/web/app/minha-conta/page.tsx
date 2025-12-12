'use client'

import Link from 'next/link'
import { 
  ShoppingCart, 
  Search, 
  CalendarPlus, 
  ArrowLeftRight, 
  Heart, 
  User, 
  MapPin, 
  Lock, 
  Mail,
} from 'lucide-react'
import { useAuthStore } from '@/lib/store/useAuthStore'

export default function MinhaContaPage() {
  const { customer, clearAuth } = useAuthStore()

  const handleLogout = () => {
    clearAuth()
    window.location.href = '/'
  }

  const cards = [
    {
      icon: ShoppingCart,
      title: 'Último pedido',
      description: 'Consulte seu último pedido realizado em nossa loja.',
      href: '/minha-conta/pedidos',
      color: 'text-blue-600'
    },
    {
      icon: Search,
      title: 'Consultar meus pedidos',
      description: 'Consulte seu último pedido realizado em nossa loja.',
      href: '/minha-conta/pedidos',
      color: 'text-purple-600'
    },
    {
      icon: CalendarPlus,
      title: 'Lista de Eventos',
      description: 'Crie listas de presentes para diversos tipos de eventos.',
      href: '#',
      color: 'text-green-600'
    },
    {
      icon: ArrowLeftRight,
      title: 'Vale Compra',
      description: 'Consulte o extrato de Vale Compras de sua conta.',
      href: '#',
      color: 'text-orange-600'
    },
    {
      icon: Heart,
      title: 'Lista de Desejos',
      description: 'Gerencie os produtos adicionados à sua lista.',
      href: '#',
      color: 'text-red-600'
    },
    {
      icon: User,
      title: 'Dados Cadastrais',
      description: 'Você poderá alterar seus dados cadastrais.',
      href: '/minha-conta/meus-dados',
      color: 'text-indigo-600'
    },
    {
      icon: MapPin,
      title: 'Gestão de Endereços',
      description: 'Gerencie seus endereços de entrega em nosso sistema.',
      href: '/minha-conta/enderecos',
      color: 'text-pink-600'
    },
    {
      icon: Lock,
      title: 'Alterar senha',
      description: 'Crie uma nova senha para seu cadastro em nossa loja.',
      href: '/minha-conta/alterar-senha',
      color: 'text-gray-600'
    },
    {
      icon: Mail,
      title: 'Alterar e-mail',
      description: 'Crie um novo e-mail para o seu cadastro em nossa loja.',
      href: '/minha-conta/alterar-email',
      color: 'text-teal-600'
    },
  ]

  return (
    <div className="w-full">
      {/* Header Centralizado */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">Área do Cliente</h1>
        <p className="text-lg text-gray-600 mb-6">
          Tenha controle total da sua conta com segurança e praticidade
        </p>
        
        {/* Nome e Sair */}
        {customer && (
          <div className="flex items-center justify-center gap-2 text-base">
            <span className="text-gray-700">
              Olá, <span className="font-semibold text-gray-900">{customer.name}!</span>
            </span>
            <span className="text-gray-400">|</span>
            <button
              onClick={handleLogout}
              className="text-blue-600 hover:text-blue-700 hover:underline"
            >
              (sair)
            </button>
          </div>
        )}
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card) => {
          const Icon = card.icon
          const isDisabled = card.href === '#'
          return (
            <Link
              key={card.title}
              href={card.href}
              className={`
                bg-white rounded-lg border border-gray-200 p-6 transition-all
                ${isDisabled 
                  ? 'cursor-not-allowed opacity-60' 
                  : 'hover:shadow-lg hover:border-gray-300 cursor-pointer'
                }
              `}
              onClick={isDisabled ? (e) => e.preventDefault() : undefined}
            >
              <div className="flex items-start space-x-4">
                <div className={`${card.color} flex-shrink-0`}>
                  <Icon className="h-8 w-8" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {card.title}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {card.description}
                  </p>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

