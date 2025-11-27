'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Package, Palette, Ticket, Settings, Tags, ShoppingCart, Warehouse, Store } from 'lucide-react'
import { cn } from '@white-label/ui'

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
    title: 'Tema',
    href: '/theme',
    icon: Palette
  },
  {
    title: 'Cupons',
    href: '/coupons',
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

  return (
    <aside className="flex min-h-screen w-72 flex-col border-r border-gray-200/70 bg-[#f6f4f2] px-6 py-8">
      <div className="space-y-1">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.55em] text-gray-400">
          White Label
        </p>
        <h2 className="text-2xl font-semibold tracking-tight text-gray-900">Admin</h2>
        <p className="text-sm font-light text-gray-500">E-commerce</p>
      </div>

      <nav className="mt-10 flex flex-1 flex-col gap-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium tracking-wide transition-all duration-200',
                isActive
                  ? 'bg-gray-900 text-white shadow-[0_15px_35px_rgba(15,23,42,0.15)]'
                  : 'text-gray-600 hover:bg-white hover:text-gray-900'
              )}
            >
              <Icon className={cn('h-5 w-5', isActive ? 'text-white' : 'text-gray-400')} />
              <span>{item.title}</span>
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto rounded-2xl border border-gray-200/70 bg-white/70 p-4 text-xs text-gray-500">
        <p className="font-medium text-gray-900">Suporte exclusivo</p>
        <p className="mt-1 text-gray-500">support@white-label.io</p>
        <p className="mt-2 text-[0.65rem] uppercase tracking-[0.35em] text-gray-400">
          © {new Date().getFullYear()} White Label
        </p>
      </div>
    </aside>
  )
}

