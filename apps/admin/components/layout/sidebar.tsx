'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import {
  LayoutDashboard,
  Package,
  Ticket,
  Settings,
  Tags,
  ShoppingCart,
  Warehouse,
  Store,
  Building2,
  Users,
  ChevronLeft,
  ChevronRight,
  Palette,
  HelpCircle,
} from 'lucide-react'

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
    icon: LayoutDashboard,
  },
  {
    title: 'Produtos',
    href: '/products',
    icon: Package,
  },
  {
    title: 'Categorias',
    href: '/categories',
    icon: Tags,
  },
  {
    title: 'Estoque',
    href: '/stock',
    icon: Warehouse,
  },
  {
    title: 'Pedidos',
    href: '/orders',
    icon: ShoppingCart,
  },
  {
    title: 'Vendas Físicas',
    href: '/physical-sales',
    icon: Store,
  },
  {
    title: 'Equipe',
    href: '/users',
    icon: Users,
  },
  {
    title: 'Loja',
    href: '/store',
    icon: Building2,
  },
  {
    title: 'Editor',
    href: '/editor',
    icon: Palette,
  },
  {
    title: 'Cupons',
    href: '/cupons',
    icon: Ticket,
  },
  {
    title: 'Configurações',
    href: '/settings',
    icon: Settings,
  },
  {
    title: 'Como usar',
    href: '/guide',
    icon: HelpCircle,
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { isCollapsed, toggleSidebar, isMobileOpen, setIsMobileOpen } = useSidebar()

  return (
    <>
      {/* Overlay para mobile */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 z-50 flex h-screen flex-col border-r border-border bg-background py-4 transition-all duration-200 ease-out lg:relative lg:z-auto',
          // Mobile: drawer que desliza
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          // Desktop: collapse normal
          isCollapsed ? 'w-20 px-2' : 'w-72 px-4'
        )}
        style={{
          contain: 'layout style paint',
          willChange: isCollapsed ? 'width' : 'width',
        }}
      >
      {/* Botão toggle - apenas desktop */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-4 z-10 hidden h-6 w-6 items-center justify-center rounded-full border border-border bg-surface shadow-sm transition-all duration-200 hover:bg-hover active:scale-95 dark:bg-surface-2 lg:flex"
        aria-label={isCollapsed ? 'Expandir menu' : 'Recolher menu'}
      >
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4 text-text-secondary" />
        ) : (
          <ChevronLeft className="h-4 w-4 text-text-secondary" />
        )}
      </button>

      {/* Botão fechar - apenas mobile */}
      <button
        onClick={() => setIsMobileOpen(false)}
        className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface transition-all duration-200 hover:bg-hover active:scale-95 dark:bg-surface-2 lg:hidden"
        aria-label="Fechar menu"
      >
        <ChevronLeft className="h-4 w-4 text-text-secondary" />
      </button>

      {/* Header */}
      <div
        className={cn(
          'space-y-2 overflow-hidden transition-all duration-200 ease-out',
          isCollapsed ? 'max-h-0 opacity-0' : 'max-h-24 opacity-100'
        )}
      >
        <div className="flex items-center gap-3">
          {/* Logo LVX Commerce */}
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 dark:bg-primary/20 flex-shrink-0">
            <span className="text-lg font-bold text-primary dark:text-primary">LVX</span>
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <h2 className="text-title-l font-bold tracking-tight text-text-primary dark:text-white truncate">
                LVX Commerce
              </h2>
              <p className="text-small font-normal text-text-secondary dark:text-[#B5B5B5]">
                Área do administrador
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className={cn('flex flex-1 flex-col gap-1', isCollapsed ? 'mt-1' : 'mt-6')}>
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center rounded-base py-2.5 text-body font-medium transition-all duration-200',
                isCollapsed ? 'justify-center px-2' : 'gap-3 px-3',
                isActive
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-text-secondary hover:bg-hover hover:text-text-primary'
              )}
              title={isCollapsed ? item.title : undefined}
            >
              <Icon
                className={cn(
                  'h-5 w-5 flex-shrink-0',
                  isActive ? 'text-white' : 'text-text-tertiary'
                )}
              />
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
          'mt-auto rounded-base border border-border bg-surface p-4 text-small text-text-secondary transition-all duration-200 ease-out overflow-hidden dark:bg-surface-2',
          isCollapsed ? 'max-h-0 opacity-0 p-0 border-0' : 'max-h-40 opacity-100'
        )}
      >
        <p className="font-semibold text-text-primary">Suporte exclusivo</p>
        <p className="mt-1 text-text-secondary">linvex.software@gmail.com</p>
        <p className="mt-2 text-small uppercase tracking-wider text-text-tertiary">
          © {new Date().getFullYear()} Linvex
        </p>
      </div>
    </aside>
    </>
  )
}
