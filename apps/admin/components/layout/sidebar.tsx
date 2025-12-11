'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
 
import { LayoutDashboard, Package, Ticket, Settings, Tags, ShoppingCart, Warehouse, Store, Building2, Users, ChevronLeft, ChevronRight, Palette } from 'lucide-react'
 
import { cn } from '@white-label/ui'
import { useSidebar } from './sidebar-context'

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard
  },
  {
    title: 'Produtos',
    href: '/products',
    icon: Package
  },
  {
    title: 'Categorias',
    href: '/categories',
    icon: Tags
  },
  {
    title: 'Estoque',
    href: '/stock',
    icon: Warehouse
  },
  {
    title: 'Pedidos',
    href: '/orders',
    icon: ShoppingCart
  },
  {
    title: 'Vendas Físicas',
    href: '/physical-sales',
    icon: Store
  },
  {
    title: 'Equipe',
    href: '/users',
    icon: Users
  },
  {
    title: 'Loja',
    href: '/store',
    icon: Building2
  },
  {
    title: 'Editor',
    href: '/editor',
    icon: Palette
  },
  {
    title: 'Cupons',
    href: '/cupons',
    icon: Ticket
  },
  {
    title: 'Configurações',
    href: '/settings',
    icon: Settings
  }
]

export function Sidebar() {
  const pathname = usePathname()
  const { isCollapsed, toggleSidebar } = useSidebar()

  return (
    <aside
      className={cn(
        'relative flex min-h-screen flex-col border-r border-gray-200/70 bg-[#f6f4f2] py-8 transition-[width,padding] duration-200 ease-out',
        isCollapsed ? 'w-20 px-4' : 'w-72 px-6'
      )}
      style={{ 
        contain: 'layout style paint',
        willChange: isCollapsed ? 'width' : 'width'
      }}
    >
      {/* Botão toggle */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-8 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm transition-transform duration-150 hover:bg-gray-50 active:scale-95"
        aria-label={isCollapsed ? 'Expandir menu' : 'Recolher menu'}
      >
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4 text-gray-600" />
        ) : (
          <ChevronLeft className="h-4 w-4 text-gray-600" />
        )}
      </button>

      {/* Header */}
      <div 
        className={cn(
          'space-y-1 overflow-hidden transition-all duration-200 ease-out',
          isCollapsed ? 'max-h-0 opacity-0' : 'max-h-20 opacity-100'
        )}
      >
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.55em] text-gray-400">
          White Label
        </p>
        <h2 className="text-2xl font-semibold tracking-tight text-gray-900">Admin</h2>
        <p className="text-sm font-light text-gray-500">E-commerce</p>
      </div>

      {/* Navigation */}
      <nav className={cn('flex flex-1 flex-col gap-2', isCollapsed ? 'mt-1' : 'mt-10')}>
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center rounded-2xl py-3 text-sm font-medium tracking-wide transition-colors duration-150',
                isCollapsed ? 'justify-center px-4' : 'gap-3 px-4',
                isActive
                  ? 'bg-gray-900 text-white shadow-[0_15px_35px_rgba(15,23,42,0.15)]'
                  : 'text-gray-600 hover:bg-white hover:text-gray-900'
              )}
              title={isCollapsed ? item.title : undefined}
            >
              <Icon className={cn('h-5 w-5 flex-shrink-0', isActive ? 'text-white' : 'text-gray-400')} />
              <span 
                className={cn(
                  'truncate whitespace-nowrap transition-all duration-200 ease-out',
                  isCollapsed ? 'max-w-0 opacity-0 overflow-hidden' : 'max-w-[200px] opacity-100'
                )}
              >
                {item.title}
              </span>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div 
        className={cn(
          'mt-auto rounded-2xl border border-gray-200/70 bg-white/70 p-4 text-xs text-gray-500 transition-all duration-200 ease-out overflow-hidden',
          isCollapsed ? 'max-h-0 opacity-0 p-0 border-0' : 'max-h-40 opacity-100'
        )}
      >
          <p className="font-medium text-gray-900">Suporte exclusivo</p>
          <p className="mt-1 text-gray-500">support@white-label.io</p>
          <p className="mt-2 text-[0.65rem] uppercase tracking-[0.35em] text-gray-400">
            © {new Date().getFullYear()} White Label
          </p>
      </div>
    </aside>
  )
}
 