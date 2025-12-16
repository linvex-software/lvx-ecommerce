'use client'

import { useState } from "react";
import { ShoppingBag, Search, User, Menu, X, ChevronDown, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useStoreTheme } from "@/lib/hooks/use-store-theme";
import { useNavbar } from "@/lib/hooks/use-navbar";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import * as LucideIcons from "lucide-react";
import type { NavbarItem } from "@/lib/types/navbar";

interface NavbarProps {
  cartCount?: number;
  onCartClick?: () => void;
  onSearch?: (query: string) => void;
}

export function Navbar({ cartCount = 0, onCartClick, onSearch }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const { data: theme } = useStoreTheme();
  
  // Buscar itens do menu do banco de dados
  const { data: navbarData, isLoading } = useNavbar();
  const menuItems: NavbarItem[] = Array.isArray((navbarData as { navbar_items?: NavbarItem[] })?.navbar_items) 
    ? (navbarData as { navbar_items: NavbarItem[] }).navbar_items 
    : [];

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const getIcon = (iconName?: string) => {
    if (!iconName) return null;
    const IconComponent = (LucideIcons as Record<string, unknown>)[iconName] as React.ComponentType<{ className?: string }>;
    return IconComponent ? <IconComponent className="w-4 h-4" /> : null;
  };

  const getItemStyle = (item: NavbarItem, isMobile = false) => {
    if (!item.style) return {};
    
    const baseStyle: React.CSSProperties = {
      color: item.style.color,
      fontSize: item.style.fontSize,
      fontWeight: item.style.fontWeight,
      padding: item.style.padding,
      margin: item.style.margin,
      border: item.style.border,
      borderRadius: item.style.borderRadius,
    };

    // Aplicar estilos responsivos
    if (item.style.responsive) {
      const responsiveStyle = isMobile 
        ? item.style.responsive.mobile 
        : item.style.responsive.desktop;
      
      return { ...baseStyle, ...responsiveStyle } as React.CSSProperties;
    }

    return baseStyle;
  };

  const renderNavbarItem = (item: NavbarItem, level = 0, isMobile = false) => {
    if (!item.visible) return null;

    const style = getItemStyle(item, isMobile);
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(item.id);

    // Submenu ou item com filhos
    if (item.type === 'submenu' || hasChildren) {
      if (isMobile) {
        return (
          <div key={item.id} className="space-y-1">
            <button
              onClick={() => toggleExpanded(item.id)}
              className="flex items-center justify-between w-full p-3 rounded-lg hover:bg-muted transition-colors"
              style={{ color: item.style?.color || 'var(--store-text-color, #000000)' }}
            >
              <div className="flex items-center gap-2">
                {item.icon && getIcon(item.icon)}
                <span className="text-sm font-medium">{item.label}</span>
              </div>
              <ChevronRight className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
            </button>
            {isExpanded && hasChildren && (
              <div className="ml-4 space-y-1">
                {item.children?.map((child) => renderNavbarItem(child, level + 1, isMobile))}
              </div>
            )}
          </div>
        );
      }

      // Desktop: dropdown
      return (
        <div key={item.id} className="relative group">
          <button
            onClick={() => toggleExpanded(item.id)}
            style={style}
            className="hover:text-muted-foreground transition-colors flex items-center gap-1"
            onMouseEnter={(e) => {
              if (item.style?.hoverColor) {
                e.currentTarget.style.color = item.style.hoverColor;
              }
            }}
            onMouseLeave={(e) => {
              if (item.style?.color) {
                e.currentTarget.style.color = item.style.color;
              } else {
                e.currentTarget.style.color = '';
              }
            }}
          >
            {item.icon && getIcon(item.icon)}
            <span>{item.label}</span>
            <ChevronDown className={`h-3 w-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </button>
          {(isExpanded || true) && hasChildren && (
            <div className="absolute top-full left-0 mt-1 bg-background border border-border rounded-md shadow-lg min-w-[200px] z-50 py-2">
              {item.children?.map((child) => (
                <Link
                  key={child.id}
                  href={child.type === 'external' ? child.url || '#' : child.url || '#'}
                  target={child.type === 'external' ? child.target || '_blank' : undefined}
                  rel={child.type === 'external' ? 'noopener noreferrer' : undefined}
                  className="block px-4 py-2 hover:bg-muted transition-colors"
                  style={getItemStyle(child, false)}
                >
                  {child.icon && getIcon(child.icon)}
                  <span>{child.label}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      );
    }

    // Link simples
    const linkProps = item.type === 'external' 
      ? { href: item.url || '#', target: item.target || '_blank' as const, rel: 'noopener noreferrer' as const }
      : { href: item.url || '#' };

    if (isMobile) {
      return (
        <Link
          key={item.id}
          {...linkProps}
          onClick={closeMenu}
          className="flex items-center gap-2 p-3 rounded-lg hover:bg-muted transition-colors"
          style={style}
        >
          {item.icon && getIcon(item.icon)}
          <span className="text-sm font-medium">{item.label}</span>
        </Link>
      );
    }

    return (
      <Link
        key={item.id}
        {...linkProps}
        style={style}
        className="hover:text-muted-foreground transition-colors flex items-center gap-1"
        onMouseEnter={(e) => {
          if (item.style?.hoverColor) {
            e.currentTarget.style.color = item.style.hoverColor;
          }
        }}
        onMouseLeave={(e) => {
          if (item.style?.color) {
            e.currentTarget.style.color = item.style.color;
          } else {
            e.currentTarget.style.color = '';
          }
        }}
      >
        {item.icon && getIcon(item.icon)}
        <span>{item.label}</span>
      </Link>
    );
  };

  return (
    <>
      <nav className="sticky top-0 bg-background z-50 flex flex-col shadow-sm store-navbar-editor">
        {/* Top Bar */}
        <div className="border-b border-border">
          <div className="container mx-auto px-4 py-3 md:py-4">
            <div className="flex items-center justify-between gap-4">
              {/* Logo - Left on Mobile, Center on Desktop */}
              <Link href="/" className="flex items-center gap-3 md:flex-1 cursor-pointer">
                {theme?.logo_url ? (
                  <img
                    src={theme.logo_url}
                    alt="Logo"
                    className="w-12 h-12 md:w-14 md:h-14 object-contain"
                  />
                ) : (
                  <div className="w-12 h-12 md:w-14 md:h-14 bg-muted rounded flex items-center justify-center">
                    <span className="text-xs font-semibold" style={{ color: 'var(--store-text-color, #000000)' }}>Logo</span>
                  </div>
                )}
              </Link>

              {/* Search Bar - Desktop Only */}
              <div className="flex-1 max-w-md hidden md:block">
                <div className="relative">
                  <Input
                    placeholder="O que você está buscando?"
                    className="rounded-full pl-4 pr-10 border-foreground/20 focus-visible:ring-2 focus-visible:ring-foreground/20"
                    onChange={(e) => onSearch?.(e.target.value)}
                  />
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--store-icon-color, #000000)' }} />
                </div>
              </div>

              {/* Icons - Right */}
              <div className="flex items-center justify-end gap-3 md:gap-6 md:flex-1">
                {/* Search Icon - Mobile Only */}
                <button
                  onClick={() => setIsSearchOpen(!isSearchOpen)}
                  className="md:hidden p-2 hover:bg-muted rounded-full transition-colors"
                  aria-label="Buscar"
                >
                  <Search className="h-5 w-5" style={{ color: 'var(--store-icon-color, #000000)' }} />
                </button>

                {/* User Icon - Desktop Only */}
                <div className="hidden md:flex flex-col items-center cursor-pointer hover:text-muted-foreground transition-colors">
                  <User className="h-5 w-5" style={{ color: 'var(--store-icon-color, #000000)' }} />
                  <span className="text-[10px] mt-1" style={{ color: 'var(--store-text-color, #000000)' }}>Minha Conta</span>
                </div>

                {/* Cart Icon */}
                <div
                  className="flex flex-col items-center cursor-pointer hover:text-muted-foreground transition-colors relative"
                  onClick={onCartClick}
                >
                  <motion.div
                    className="relative"
                    animate={cartCount > 0 ? { scale: [1, 1.15, 1] } : {}}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                  >
                    <ShoppingBag className="h-5 w-5" style={{ color: 'var(--store-icon-color, #000000)' }} />
                    <AnimatePresence>
                      {cartCount > 0 && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                          className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-foreground text-background text-[9px] flex items-center justify-center font-bold"
                        >
                          {cartCount}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.div>
                  <span className="text-[10px] mt-1 hidden md:block" style={{ color: 'var(--store-text-color, #000000)' }}>Carrinho</span>
                </div>

                {/* Hamburger Menu - Mobile Only */}
                <button
                  onClick={toggleMenu}
                  className="md:hidden p-2 hover:bg-muted rounded-full transition-colors"
                  aria-label="Menu"
                >
                  <Menu className="h-6 w-6" style={{ color: 'var(--store-icon-color, #000000)' }} />
                </button>
              </div>
            </div>

            {/* Mobile Search Bar */}
            {isSearchOpen && (
              <div className="mt-3 md:hidden">
                <div className="relative">
                  <Input
                    placeholder="O que você está buscando?"
                    className="rounded-full pl-4 pr-10 border-foreground/20"
                    onChange={(e) => onSearch?.(e.target.value)}
                    autoFocus
                  />
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--store-icon-color, #000000)' }} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Bar - Desktop Only */}
        {!isLoading && menuItems.length > 0 && (
          <div className="border-b border-border py-3 hidden md:block">
            <div className="container mx-auto px-4">
              <div className="flex items-center justify-center gap-8 text-xs font-medium tracking-wide">
                {menuItems.map((item) => renderNavbarItem(item, 0, false))}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 md:hidden transition-opacity duration-300"
          onClick={closeMenu}
        />
      )}

      {/* Mobile Menu Sidebar - Slides from Right */}
      <div
        className={`fixed top-0 right-0 h-full w-[280px] bg-background z-50 shadow-2xl transform transition-transform duration-300 ease-in-out md:hidden ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
      >
        {/* Menu Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-bold" style={{ color: 'var(--store-text-color, #000000)' }}>Menu</h2>
          <button
            onClick={closeMenu}
            className="p-2 hover:bg-muted rounded-full transition-colors"
            aria-label="Fechar menu"
          >
            <X className="h-6 w-6" style={{ color: 'var(--store-icon-color, #000000)' }} />
          </button>
        </div>

        {/* Menu Items */}
        <div className="overflow-y-auto h-[calc(100%-140px)]">
          <div className="p-4 space-y-1">
            {isLoading ? (
              <div className="text-center py-4 text-sm text-muted-foreground">Carregando menu...</div>
            ) : menuItems.length > 0 ? (
              menuItems.map((item) => renderNavbarItem(item, 0, true))
            ) : (
              <div className="text-center py-4 text-sm text-muted-foreground">Nenhum item no menu</div>
            )}
          </div>
        </div>

        {/* Menu Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border bg-background">
          <a
            href="#"
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
            onClick={closeMenu}
          >
            <User className="h-5 w-5" style={{ color: 'var(--store-icon-color, #000000)' }} />
            <span className="text-sm font-medium" style={{ color: 'var(--store-text-color, #000000)' }}>Minha Conta</span>
          </a>
        </div>
      </div>
    </>
  );
}

