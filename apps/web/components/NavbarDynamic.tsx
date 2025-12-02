'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X, ChevronDown } from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import type { NavbarItem } from '@/lib/types/navbar'

interface NavbarDynamicProps {
  items: NavbarItem[]
  cartCount?: number
  onCartClick?: () => void
  onSearch?: (query: string) => void
}

export default function NavbarDynamic({ items, cartCount = 0, onCartClick, onSearch }: NavbarDynamicProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedItems(newExpanded)
  }

  const getIcon = (iconName?: string) => {
    if (!iconName) return null
    const IconComponent = (LucideIcons as Record<string, unknown>)[iconName] as React.ComponentType<{ className?: string }>
    return IconComponent ? <IconComponent className="w-4 h-4" /> : null
  }

  const getItemStyle = (item: NavbarItem, isMobile = false) => {
    if (!item.style) return {}
    
    const baseStyle = {
      color: item.style.color,
      fontSize: item.style.fontSize,
      fontWeight: item.style.fontWeight,
      padding: item.style.padding,
      margin: item.style.margin,
      border: item.style.border,
      borderRadius: item.style.borderRadius,
    }

    // Aplicar estilos responsivos
    if (item.style.responsive) {
      const responsiveStyle = isMobile 
        ? item.style.responsive.mobile 
        : item.style.responsive.desktop
      
      return { ...baseStyle, ...responsiveStyle }
    }

    return baseStyle
  }

  const renderItem = (item: NavbarItem, level = 0, isMobile = false) => {
    if (!item.visible) return null

    const style = getItemStyle(item, isMobile)
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedItems.has(item.id)

    if (item.type === 'submenu' || hasChildren) {
      return (
        <div key={item.id} className="relative group">
          <button
            onClick={() => toggleExpanded(item.id)}
            style={style}
            className="flex items-center gap-1 hover:opacity-80 transition-opacity"
            onMouseEnter={(e) => {
              if (item.style?.hoverColor) {
                e.currentTarget.style.color = item.style.hoverColor
              }
            }}
            onMouseLeave={(e) => {
              if (item.style?.color) {
                e.currentTarget.style.color = item.style.color
              }
            }}
          >
            {item.icon && getIcon(item.icon)}
            <span>{item.label}</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </button>
          
          {(isExpanded || !isMobile) && hasChildren && (
            <div className={`${isMobile ? 'ml-4 mt-2' : 'absolute top-full left-0 mt-1 bg-background border border-border rounded-md shadow-lg min-w-[200px] z-50'} ${level > 0 ? 'ml-4' : ''}`}>
              {item.children?.map((child) => renderItem(child, level + 1, isMobile))}
            </div>
          )}
        </div>
      )
    }

    const linkProps = item.type === 'external' 
      ? { href: item.url, target: item.target || '_blank', rel: 'noopener noreferrer' }
      : { href: item.url || '#' }

    return (
      <Link
        key={item.id}
        {...linkProps}
        style={style}
        className="flex items-center gap-1 hover:opacity-80 transition-opacity"
        onMouseEnter={(e) => {
          if (item.style?.hoverColor) {
            e.currentTarget.style.color = item.style.hoverColor
          }
        }}
        onMouseLeave={(e) => {
          if (item.style?.color) {
            e.currentTarget.style.color = item.style.color
          }
        }}
      >
        {item.icon && getIcon(item.icon)}
        <span>{item.label}</span>
      </Link>
    )
  }

  const visibleItems = items.filter(item => item.visible)

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold">LOGO</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-6">
            {visibleItems.map((item) => renderItem(item, 0, false))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            {onSearch && (
              <button className="text-muted-foreground hover:text-foreground">
                <LucideIcons.Search className="w-5 h-5" />
              </button>
            )}
            {onCartClick && (
              <button
                onClick={onCartClick}
                className="relative text-muted-foreground hover:text-foreground"
              >
                <LucideIcons.ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </button>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMobileMenu}
              className="md:hidden text-muted-foreground hover:text-foreground"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border py-4 space-y-2">
            {visibleItems.map((item) => renderItem(item, 0, true))}
          </div>
        )}
      </div>
    </nav>
  )
}







