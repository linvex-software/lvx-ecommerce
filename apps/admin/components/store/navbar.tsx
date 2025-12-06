'use client'

import { useNode, useEditor } from '@craftjs/core'
import { useState } from "react";
import { ShoppingBag, Search, User, Menu, X, ChevronDown, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useStoreTheme } from "@/lib/hooks/use-store-theme";
import { PreviewContext } from "@/components/editor/preview-context";
import { useContext } from "react";
import Link from "next/link";

interface NavbarProps {
  cartCount?: number;
  onCartClick?: () => void;
  onSearch?: (query: string) => void;
}

export function Navbar({ cartCount = 0, onCartClick, onSearch }: NavbarProps) {
  const {
    connectors: { connect, drag },
    isActive
  } = useNode((state) => ({
    isActive: state.events.selected
  }))
  
  // Detectar se estamos no editor
  const { enabled } = useEditor((state) => ({
    enabled: state.options.enabled
  }))
  
  const isInEditor = enabled

  // Detectar modo de preview (mobile/tablet/desktop)
  // Usar contexto de forma segura (pode não existir se não estiver no editor)
  const previewContext = useContext(PreviewContext)
  const previewMode = previewContext?.previewMode || 'desktop'
  const isMobilePreview = previewMode === 'mobile' || previewMode === 'tablet'

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { data: theme } = useStoreTheme();

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  const menuItems = [
    { label: "NOVIS!", href: "#" },
    { label: "COLEÇÃO NOVA", href: "#", badge: "ESPECIAL FIM DE ANO" },
    { label: "PRODUTOS", href: "#", hasSubmenu: true },
    { label: "MAIS VENDIDOS", href: "#" },
    { label: "SALE!", href: "#", highlight: true },
    { label: "KITS PROMOCIONAIS", href: "#" },
    { label: "BAZAR", href: "#" },
  ];

  return (
    <div
      ref={(ref) => {
        if (ref) {
          connect(drag(ref))
        }
      }}
      className={`relative w-full ${isActive ? 'ring-2 ring-blue-500' : ''}`}
      style={{
        cursor: isInEditor ? 'move' : 'default',
        position: 'relative',
        minHeight: isInEditor && isMobilePreview ? '' : 'auto',
        overflow: isInEditor && isMobilePreview ? 'hidden' : 'visible'
      }}
    >
      <nav className="sticky top-0 bg-background z-50 flex flex-col shadow-sm">
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

              {/* Search Bar - Desktop Only (ou quando preview não é mobile/tablet) */}
              <div className={`flex-1 max-w-md ${isMobilePreview ? 'hidden' : 'block'}`}>
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
              <div className={`flex items-center justify-end gap-3 ${isMobilePreview ? 'gap-3' : 'md:gap-6 md:flex-1'}`}>
                {/* Search Icon - Mobile Only (ou quando preview é mobile/tablet) */}
                <button
                  onClick={() => setIsSearchOpen(!isSearchOpen)}
                  className={`${isMobilePreview ? 'block' : 'md:hidden'} p-2 hover:bg-muted rounded-full transition-colors`}
                  aria-label="Buscar"
                >
                  <Search className="h-5 w-5" style={{ color: 'var(--store-icon-color, #000000)' }} />
                </button>

                {/* User Icon - Desktop Only (ou quando preview não é mobile/tablet) */}
                <div className={`${isMobilePreview ? 'hidden' : 'hidden md:flex'} flex-col items-center cursor-pointer hover:text-muted-foreground transition-colors`}>
                  <User className="h-5 w-5" style={{ color: 'var(--store-icon-color, #000000)' }} />
                  <span className="text-[10px] mt-1" style={{ color: 'var(--store-text-color, #000000)' }}>Minha Conta</span>
                </div>

                {/* Cart Icon */}
                <div
                  className="flex flex-col items-center cursor-pointer hover:text-muted-foreground transition-colors relative"
                  onClick={onCartClick}
                >
                  <div className="relative">
                    <ShoppingBag className="h-5 w-5" style={{ color: 'var(--store-icon-color, #000000)' }} />
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-foreground text-background text-[9px] flex items-center justify-center font-bold">
                        {cartCount}
                      </span>
                    )}
                  </div>
                  {!enabled && (
                    <span className="text-[10px] mt-1 hidden md:block" style={{ color: 'var(--store-text-color, #000000)' }}>Carrinho</span>
                  )}
                </div>

                {/* Hamburger Menu - Mobile Only (ou quando preview é mobile/tablet) */}
                <button
                  onClick={toggleMenu}
                  className={`${isMobilePreview ? 'block' : 'md:hidden'} p-2 hover:bg-muted rounded-full transition-colors`}
                  aria-label="Menu"
                >
                  <Menu className="h-6 w-6" style={{ color: 'var(--store-icon-color, #000000)' }} />
                </button>
              </div>
            </div>

            {/* Mobile Search Bar */}
            {isSearchOpen && (
              <div className={`mt-3 ${isMobilePreview ? 'block' : 'md:hidden'}`}>
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

        {/* Navigation Bar - Desktop Only (ou quando preview não é mobile/tablet) */}
        <div className={`border-b border-border py-3 ${isMobilePreview ? 'hidden' : 'block'}`}>
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-center gap-8 text-xs font-medium tracking-wide">
              {menuItems.map((item, index) => (
                <a
                  key={index}
                  href={item.href}
                  className={`hover:text-muted-foreground transition-colors flex items-center gap-1 ${item.highlight ? 'text-red-600 font-bold' : ''
                    }`}
                  style={{ color: item.highlight ? undefined : 'var(--store-text-color, #000000)' }}
                >
                  {item.label}
                  {item.badge && <span className="text-[9px] ml-1" style={{ color: 'var(--store-text-color, #000000)' }}>• {item.badge}</span>}
                  {item.hasSubmenu && <ChevronDown className="h-3 w-3" style={{ color: 'var(--store-icon-color, #000000)' }} />}
                </a>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {/* Só mostrar quando preview for mobile/tablet OU quando não estiver no editor e for mobile real */}
      {isMenuOpen && (isMobilePreview || !isInEditor) && (
        <div
          className={`${isInEditor ? 'absolute' : 'fixed'} inset-0 bg-black/50 z-[60] md:hidden transition-opacity duration-300`}
          onClick={closeMenu}
        />
      )}

      {/* Mobile Menu Sidebar - Slides from Right */}
      {/* Só mostrar quando preview for mobile/tablet OU quando não estiver no editor e for mobile real */}
      {(isMobilePreview || !isInEditor) && (
        <div
          className={`${isInEditor ? 'absolute' : 'fixed'} top-0 right-0 ${isInEditor ? 'h-full' : 'h-full'} w-[280px] bg-background z-[70] shadow-2xl transform transition-transform duration-300 ease-in-out md:hidden ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'
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
            {menuItems.map((item, index) => (
              <a
                key={index}
                href={item.href}
                onClick={closeMenu}
                className={`flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors ${item.highlight ? 'bg-red-50 text-red-600 font-bold' : ''
                  }`}
              >
                <div className="flex flex-col">
                  <span className="text-sm font-medium" style={{ color: item.highlight ? undefined : 'var(--store-text-color, #000000)' }}>{item.label}</span>
                  {item.badge && (
                    <span className="text-[10px] mt-0.5" style={{ color: 'var(--store-text-color, #000000)' }}>
                      {item.badge}
                    </span>
                  )}
                </div>
                {item.hasSubmenu && <ChevronRight className="h-4 w-4" style={{ color: 'var(--store-icon-color, #000000)' }} />}
              </a>
            ))}
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
      )}
    </div>
  )
}

Navbar.craft = {
  displayName: 'Navbar',
  props: {
    cartCount: 0
  }
}

