'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { useNavbar } from '../../lib/hooks/use-navbar'
import type { NavbarItem } from '../../lib/types/navbar'

interface DynamicMenuProps {
  className?: string
  isMobile?: boolean
  onItemClick?: () => void // Callback para fechar menu mobile quando item é clicado
}

export function DynamicMenu({ className = '', isMobile = false, onItemClick }: DynamicMenuProps) {
  const { data, isLoading } = useNavbar()
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  const menuItems = data?.navbar_items || []

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId)
    } else {
      newExpanded.add(itemId)
    }
    setExpandedItems(newExpanded)
  }

  const isItemVisible = (item: NavbarItem): boolean => {
    if (!item.visible) return false
    
    // Verificar visibilidade por breakpoint
    if (item.visibility) {
      if (isMobile && item.visibility.mobile === false) return false
      if (!isMobile && item.visibility.desktop === false) return false
    }
    
    return true
  }

  function renderCategoryItem(
    item: NavbarItem,
    level: number,
    hasChildren: boolean,
    isExpanded: boolean
  ) {
    const config = item.config || {}
    const displayType = config.displayType || 'list'

    if (isMobile) {
      return (
        <div key={item.id} className="border-b border-border">
          <button
            onClick={() => toggleExpanded(item.id)}
            className="w-full flex items-center justify-between text-base font-body py-3 text-foreground hover:text-primary transition-colors"
          >
            <span>{item.label}</span>
            {hasChildren && (
              <ChevronRight
                className={`h-4 w-4 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
              />
            )}
          </button>
          {hasChildren && isExpanded && (
            <div className="pl-4 pb-2 space-y-1">
              {item.children!.map((child) => {
                const childHasChildren = !!(child.children && child.children.length > 0)
                const childIsExpanded = expandedItems.has(child.id)
                if (child.type === 'category') {
                  return renderCategoryItem(child, level + 1, childHasChildren, childIsExpanded)
                }
                return renderItem(child, level + 1)
              })}
            </div>
          )}
        </div>
      )
    }

    // Desktop: renderizar baseado no displayType
    if (displayType === 'mega-menu' && hasChildren) {
      return (
        <div key={item.id} className="relative group">
          <button className="text-sm font-body tracking-wide text-foreground/80 hover:text-primary transition-colors duration-200 relative flex items-center gap-1">
            <span>{item.label}</span>
            <ChevronDown className="h-4 w-4" />
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
          </button>
          <div className="absolute left-0 top-full mt-2 min-w-[200px] max-w-[min(300px,calc(100vw-2rem))] bg-white border border-border rounded-lg shadow-xl py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
            {item.children!.map((child, index) => (
              <div key={child.id}>
                <Link
                  href={child.url || '#'}
                  onClick={isMobile ? onItemClick : undefined}
                  className="block px-4 py-2.5 text-sm font-body text-foreground hover:text-primary hover:bg-muted/60 transition-colors duration-150"
                >
                  {child.label}
                </Link>
                {index < item.children!.length - 1 && (
                  <div className="border-b border-border/50" />
                )}
              </div>
            ))}
          </div>
        </div>
      )
    }

    // Default: dropdown simples
    return renderSubmenuItem(item, level, hasChildren, isExpanded)
  }

  function renderItem(item: NavbarItem, level: number = 0): React.ReactNode {

    if (!isItemVisible(item)) return null

    const hasChildren = !!(item.children && item.children.length > 0)
    const isExpanded = expandedItems.has(item.id)

    // Renderizar baseado no tipo
    switch (item.type) {
      case 'link':
      case 'internal':
      case 'external':
        const isInDropdown = level > 0
        return (
          <Link
            key={item.id}
            href={item.url || '#'}
            target={item.target || '_self'}
            onClick={isMobile ? onItemClick : undefined}
            className={isMobile 
              ? "text-base font-body py-2.5 border-b border-border/50 text-foreground/90 hover:text-primary transition-colors"
              : isInDropdown
                ? "block px-4 py-2.5 text-sm font-body text-foreground hover:text-primary hover:bg-muted/60 transition-colors duration-150"
                : "text-sm font-body tracking-wide text-foreground/80 hover:text-primary transition-colors duration-200 relative group"
            }
          >
            <span>{item.label}</span>
            {!isMobile && !isInDropdown && (
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
            )}
          </Link>
        )

      case 'category':
        return renderCategoryItem(item, level, hasChildren, isExpanded)

      case 'page':
        // Usar item.url diretamente, pois ele contém o slug correto da página selecionada
        // O slug é definido no painel de configurações quando uma página é selecionada
        const pageUrl = item.url || '#'
        const isPageInDropdown = level > 0
        return (
          <Link
            key={item.id}
            href={pageUrl}
            onClick={isMobile ? onItemClick : undefined}
            className={isMobile 
              ? "text-base font-body py-2.5 border-b border-border/50 text-foreground/90 hover:text-primary transition-colors"
              : isPageInDropdown
                ? "block px-4 py-2.5 text-sm font-body text-foreground hover:text-primary hover:bg-muted/60 transition-colors duration-150"
                : "text-sm font-body tracking-wide text-foreground/80 hover:text-primary transition-colors duration-200 relative group"
            }
          >
            <span>{item.label}</span>
            {!isMobile && !isPageInDropdown && (
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
            )}
          </Link>
        )

      case 'dynamic-list':
        const listUrl = item.url || `/produtos?filter=${item.config?.listType || 'featured'}`
        const isListInDropdown = level > 0
        return (
          <Link
            key={item.id}
            href={listUrl}
            onClick={isMobile ? onItemClick : undefined}
            className={isMobile 
              ? "text-base font-body py-2.5 border-b border-border/50 text-foreground/90 hover:text-primary transition-colors"
              : isListInDropdown
                ? "block px-4 py-2.5 text-sm font-body text-foreground hover:text-primary hover:bg-muted/60 transition-colors duration-150"
                : "text-sm font-body tracking-wide text-foreground/80 hover:text-primary transition-colors duration-200 relative group"
            }
          >
            <span>{item.label}</span>
            {!isMobile && !isListInDropdown && (
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
            )}
          </Link>
        )

      case 'custom-block':
        return renderCustomBlock(item, level)

      case 'submenu':
      default:
        return renderSubmenuItem(item, level, hasChildren, isExpanded)
    }
  }

  const renderSubmenuItem = (
    item: NavbarItem,
    level: number,
    hasChildren: boolean,
    isExpanded: boolean
  ) => {
    if (isMobile) {
      return (
        <div key={item.id} className="border-b border-border">
          <button
            onClick={() => toggleExpanded(item.id)}
            className="w-full flex items-center justify-between text-base font-body py-3 text-foreground hover:text-primary transition-colors"
          >
            <span>{item.label}</span>
            {hasChildren && (
              <ChevronRight
                className={`h-4 w-4 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
              />
            )}
          </button>
          {hasChildren && isExpanded && (
            <div className="pl-4 pb-2 space-y-1">
              {item.children!.map((child) => {
                const childHasChildren = !!(child.children && child.children.length > 0)
                const childIsExpanded = expandedItems.has(child.id)
                if (child.type === 'category') {
                  return renderCategoryItem(child, level + 1, childHasChildren, childIsExpanded)
                }
                return renderItem(child, level + 1)
              })}
            </div>
          )}
        </div>
      )
    }

    // Desktop dropdown
    return (
      <div key={item.id} className="relative group">
        <button className="text-sm font-body tracking-wide text-foreground/80 hover:text-primary transition-colors duration-200 relative flex items-center gap-1">
          <span>{item.label}</span>
          {hasChildren && <ChevronDown className="h-4 w-4" />}
          <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
        </button>
        {hasChildren && (
          <div className="absolute left-0 top-full mt-2 bg-white border border-border rounded-lg shadow-xl py-1 min-w-[180px] max-w-[240px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
            {item.children!.map((child, index) => {
              const rendered = renderItem(child, level + 1)
              const isLast = index === item.children!.length - 1
              
              // Para mobile, adicionar onClick aos links
              if (isMobile && rendered && typeof rendered === 'object' && 'type' in rendered && rendered.type === 'a') {
                return (
                  <div key={child.id}>
                    {rendered}
                    {!isLast && <div className="border-b border-border/50" />}
                  </div>
                )
              }
              return (
                <div key={child.id}>
                  {rendered}
                  {!isLast && <div className="border-b border-border/50" />}
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  const renderCustomBlock = (item: NavbarItem, level: number) => {
    const config = item.config || {}
    const blockType = config.blockType || 'banner'
    const imageUrl = config.blockData?.imageUrl

    switch (blockType) {
      case 'banner':
        return (
          <div key={item.id} className="px-3 py-2">
            {typeof imageUrl === 'string' ? (
              <img
                src={imageUrl}
                alt={item.label}
                className="max-w-xs rounded-md"
              />
            ) : null}
          </div>
        )
      case 'image':
        return (
          <div key={item.id} className="px-3 py-2">
            {typeof imageUrl === 'string' ? (
              <img
                src={imageUrl}
                alt={item.label}
                className="max-w-xs rounded-md"
              />
            ) : null}
          </div>
        )
      default:
        return (
          <div key={item.id} className="px-3 py-2 text-sm text-gray-500">
            {item.label}
          </div>
        )
    }
  }

  if (isLoading) {
    return (
      <div className={`flex items-center gap-4 ${className}`}>
        <div className="h-4 w-20 bg-gray-200 animate-pulse rounded" />
        <div className="h-4 w-20 bg-gray-200 animate-pulse rounded" />
        <div className="h-4 w-20 bg-gray-200 animate-pulse rounded" />
      </div>
    )
  }

  if (menuItems.length === 0) {
    return null
  }

  if (isMobile) {
    return (
      <nav className={`flex flex-col ${className}`}>
        {menuItems.map((item) => renderItem(item))}
      </nav>
    )
  }

  return (
    <nav className={`flex items-center gap-1 ${className}`}>
      {menuItems.map((item) => renderItem(item))}
    </nav>
  )
}

