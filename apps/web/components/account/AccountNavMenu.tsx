'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
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
  Menu,
  X,
  LogOut,
} from 'lucide-react'
import { useAuthStore } from '@/lib/store/useAuthStore'
import { cn } from '@/lib/utils'

const menuItems = [
  {
    icon: ShoppingCart,
    title: 'Último pedido',
    href: '/minha-conta/pedidos',
  },
  {
    icon: Search,
    title: 'Consultar meus pedidos',
    href: '/minha-conta/pedidos',
  },
  {
    icon: CalendarPlus,
    title: 'Lista de Eventos',
    href: '#',
  },
  {
    icon: ArrowLeftRight,
    title: 'Vale Compra',
    href: '#',
  },
  {
    icon: Heart,
    title: 'Lista de Desejos',
    href: '/minha-conta/lista-desejos',
  },
  {
    icon: User,
    title: 'Alterar dados cadastrais',
    href: '/minha-conta/meus-dados',
  },
  {
    icon: MapPin,
    title: 'Gestão de Endereços',
    href: '/minha-conta/enderecos',
  },
  {
    icon: Lock,
    title: 'Alterar senha',
    href: '/minha-conta/alterar-senha',
  },
  {
    icon: Mail,
    title: 'Alterar e-mail',
    href: '/minha-conta/alterar-email',
  },
  {
    icon: LogOut,
    title: 'Desconectar',
    href: '#',
    isLogout: true,
  },
]

export function AccountNavMenu() {
  const pathname = usePathname()
  const { customer, clearAuth } = useAuthStore()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Fechar menu mobile quando a rota mudar
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  // Prevenir scroll do body quando menu estiver aberto
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isMobileMenuOpen])

  const handleLogout = () => {
    clearAuth()
    window.location.href = '/'
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  const isActive = (href: string) => {
    if (href === '#') return false
    if (href === '/minha-conta/pedidos') {
      return pathname?.startsWith('/minha-conta/pedidos')
    }
    if (href === '/minha-conta/lista-desejos') {
      return pathname === '/minha-conta/lista-desejos'
    }
    return pathname === href
  }

  const menuContent = (
    <div className="bg-white rounded-lg border border-gray-200 p-4 lg:mt-[48px]">
      {/* User Info */}
      {customer && (
        <div className="mb-4 pb-4 border-b border-gray-200">
          <div className="text-sm">
            <span className="text-gray-600">Olá,</span>{' '}
            <span className="font-semibold text-gray-900">
              {customer.name.toLowerCase()}
            </span>
          </div>
        </div>
      )}

      {/* Menu Items */}
      <nav className="space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)

          if (item.isLogout) {
            return (
              <button
                key={item.title}
                onClick={() => {
                  handleLogout()
                  closeMobileMenu()
                }}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  'text-gray-700 hover:bg-gray-50'
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.title}</span>
              </button>
            )
          }

          if (item.href === '#') {
            return (
              <div
                key={item.title}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium',
                  'text-gray-400 cursor-not-allowed'
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.title}</span>
              </div>
            )
          }

          return (
            <Link
              key={item.title}
              href={item.href}
              onClick={closeMobileMenu}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-gray-100 text-gray-900 font-semibold'
                  : 'text-gray-700 hover:bg-gray-50'
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.title}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )

  return (
    <>
      {/* Botão hamburger - Mobile only */}
      <button
        onClick={toggleMobileMenu}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg border border-gray-200 shadow-md hover:bg-gray-50 transition-colors"
        aria-label="Abrir menu"
      >
        {isMobileMenuOpen ? (
          <X className="h-6 w-6 text-gray-900" />
        ) : (
          <Menu className="h-6 w-6 text-gray-900" />
        )}
      </button>

      {/* Backdrop - Mobile only */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={closeMobileMenu}
        />
      )}

      {/* Menu Sidebar */}
      <aside
        className={cn(
          'fixed lg:static top-0 left-0 h-full lg:h-auto w-64 flex-shrink-0 z-40',
          'transform transition-transform duration-300 ease-in-out',
          'lg:transform-none lg:pr-6 overflow-y-auto lg:overflow-visible',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {menuContent}
      </aside>
    </>
  )
}

