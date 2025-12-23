'use client'

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Search, ShoppingBag, User, Menu, X, Heart } from "lucide-react";
import { Button } from "../ui/button";
import { useCart } from "../contexts/CartContext";
import { cn } from '@/lib/utils';
import { useSafeNode } from "../../lib/hooks/use-safe-node";
import { EditableText } from "../common/editable-text";
import { Element, useEditor } from '@craftjs/core';
import { useStoreTheme } from '@/lib/hooks/use-store-theme';
import { useStoreSettings } from '@/lib/hooks/use-store-settings';
import React from 'react';
import { DynamicMenu } from '../../../../menu/dynamic-menu';
import { useHeroBannerContext, getHeaderInHero } from '../home/HeroBanner';

// Componente helper para renderizar texto editável ou texto simples
function EditableTextOrPlain({
  id,
  content,
  tag = 'span',
  className = '',
  isInCraftContext = false
}: {
  id: string
  content: string
  tag?: 'span' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  className?: string
  isInCraftContext?: boolean
}) {
  // Fora do contexto do Craft.js - renderizar texto simples
  if (!isInCraftContext) {
    const Tag = tag as keyof JSX.IntrinsicElements;
    return <Tag className={className}>{content}</Tag>;
  }

  // Se estiver no contexto do Craft.js, usar Element
  // Usar useMemo para evitar re-renderizações desnecessárias
  return React.useMemo(() => (
    <Element
      id={id}
      is={EditableText}
      tag={tag}
      className={className}
      content={content}
    />
  ), [id, tag, className, content, isInCraftContext]);
}

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { itemCount, setIsOpen, isOpen: isCartOpen } = useCart();
  const { connectors: { connect }, isInEditor } = useSafeNode();
  const { data: theme } = useStoreTheme();
  const { data: settings } = useStoreSettings();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasHydrated, setHasHydrated] = useState(true);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const isInsideHero = useHeroBannerContext();

  // Carregar hooks de autenticação apenas no contexto web (runtime)
  useEffect(() => {
    // Verificar se estamos no contexto web (não admin)
    if (typeof window === 'undefined') {
      return; // SSR, não fazer nada
    }

    const pathname = window.location.pathname;
    const isWebContext = !pathname.includes('/editor') && !pathname.includes('/admin');

    if (!isWebContext) {
      return;
    }

    // Usar uma função assíncrona para carregar o módulo apenas no runtime
    (async () => {
      try {
        const authStoreModule = await import('../../../../../lib/store/useAuthStore');

        // Criar uma função que verifica o estado atual
        const checkAuth = () => {
          const authState = authStoreModule.useAuthStore.getState();
          const authenticated = !!(authState.accessToken && authState.customer);
          setIsAuthenticated(authenticated);
          setHasHydrated(authState._hasHydrated);
        };

        // Verificar inicialmente
        checkAuth();

        // Função para carregar favoritos
        const loadFavorites = async () => {
          try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
            const storeId = process.env.NEXT_PUBLIC_STORE_ID;
            const authState = authStoreModule.useAuthStore.getState();
            
            if (authState.accessToken && storeId) {
              const response = await fetch(`${API_URL}/customers/me/favorites`, {
                headers: {
                  'Authorization': `Bearer ${authState.accessToken}`,
                  'x-store-id': storeId,
                },
              });
              
              if (response.ok) {
                const data = await response.json();
                setFavoritesCount(data.count || 0);
              }
            }
          } catch {
            // Ignorar erros 
          }
        };

        // Subscrever a mudanças no store com throttle para evitar muitas atualizações
        let timeoutId: NodeJS.Timeout | null = null;
        const unsubscribe = authStoreModule.useAuthStore.subscribe(() => {
          // Debounce para evitar muitas atualizações
          if (timeoutId) clearTimeout(timeoutId);
          timeoutId = setTimeout(() => {
            checkAuth();
            // Recarregar favoritos quando autenticação mudar
            const currentAuthState = authStoreModule.useAuthStore.getState();
            if (currentAuthState.accessToken && currentAuthState.customer) {
              loadFavorites();
            } else {
              setFavoritesCount(0);
            }
          }, 100);
        });

        // Carregar favoritos inicialmente se estiver autenticado
        const initialAuthState = authStoreModule.useAuthStore.getState();
        if (initialAuthState.accessToken && initialAuthState.customer) {
          loadFavorites();
        }

        // Retornar função de cleanup
        return () => unsubscribe();
      } catch (error) {
        // Se não conseguir importar (ex: no admin), usar valores padrão
        setIsAuthenticated(false);
        setHasHydrated(true);
      }
    })();
  }, []);

  // Usar isInEditor do useSafeNode para verificar se está no editor
  // isInEditor já está disponível do hook useSafeNode

  // Detectar scroll para transição suave de opacidade/background
  useEffect(() => {
    if (isInEditor || typeof window === 'undefined') {
      return;
    }

    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsScrolled(scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Verificar estado inicial

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isInEditor]);

  // Menu dinâmico será carregado pelo DynamicMenu

  // Se o Header está sendo renderizado pelo layout.json (não dentro do HeroBanner)
  // e já há um Header dentro de um HeroBanner, não renderizar (evita duplicação)
  if (!isInsideHero && getHeaderInHero()) {
    return null;
  }

  return (
    <header
      ref={(ref: HTMLElement | null) => { if (ref) connect(ref) }}
      className={cn(
        isInEditor ? '' : 'sticky top-0 transition-all duration-300 w-full',
        isScrolled 
          ? 'bg-background/95 border-b border-border' 
          : 'bg-transparent'
      )}
      style={{
        zIndex: isInEditor ? 1 : (isCartOpen ? 9998 : 9999),
        position: isInEditor ? 'relative' : 'sticky',
      }}
    >
      {/* Main Header */}
      <div className="container mx-auto px-4">
        <div className="relative flex items-center justify-between h-16 xl:h-20">
          {/* Mobile/Tablet Menu Button - à esquerda no mobile/tablet */}
          <button
            className={cn(
              "xl:hidden p-2 -ml-2 transition-colors z-10",
              isScrolled ? "text-foreground" : "text-white"
            )}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Logo - centralizado absolutamente no mobile/tablet, à esquerda no desktop */}
          <Link 
            href="/" 
            className="absolute left-1/2 transform -translate-x-1/2 xl:relative xl:left-0 xl:transform-none flex-shrink-0 z-10"
          >
            {theme?.logo_url ? (
              <img
                src={theme.logo_url}
                alt="Logo"
                className={cn(
                  "h-8 xl:h-10 object-contain transition-all duration-300",
                  !isScrolled && ""
                )}
                style={!isScrolled ? {   } : {}}
              />
            ) : (
              <h1 className={cn(
                "font-display text-2xl xl:text-3xl font-semibold tracking-wide transition-colors duration-300",
                isScrolled ? "text-foreground" : "text-white"
              )}>
                {settings?.name || "Minha Loja"}
              </h1>
            )}
          </Link>

          {/* Desktop Navigation - Menu Dinâmico (centro) */}
          <nav className="hidden xl:flex items-center gap-8 flex-1 justify-center">
            <DynamicMenu 
              className="flex items-center gap-8" 
              isMobile={false} 
              variant={isScrolled ? 'default' : 'light'}
            />
          </nav>

          {/* Actions Mobile - Pesquisar e Carrinho */}
          <div className="xl:hidden flex items-center gap-2 z-10">
            <Link href="/busca" className={cn(
              "p-2 transition-colors",
              isScrolled ? "hover:text-primary text-foreground" : "hover:text-white/80 text-white"
            )}>
              <Search size={20} />
            </Link>
            <button
              onClick={() => setIsOpen(true)}
              className={cn(
                "p-2 transition-colors relative",
                isScrolled ? "hover:text-primary text-foreground" : "hover:text-white/80 text-white"
              )}
            >
              <ShoppingBag size={20} />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium">
                  {itemCount}
                </span>
              )}
            </button>
          </div>

          {/* Actions - Desktop only */}
          <div className="hidden xl:flex items-center gap-2 xl:gap-4">
            <Link href="/busca" className={cn(
              "p-2 transition-colors",
              isScrolled ? "hover:text-primary text-foreground" : "hover:text-white/80 text-white"
            )}>
              <Search size={20} />
            </Link>
            <Link href="/minha-conta" className={cn(
              "p-2 transition-colors",
              isScrolled ? "hover:text-primary text-foreground" : "hover:text-white/80 text-white"
            )}>
              <User size={20} />
            </Link>
            {/* Favoritos - Sempre visível */}
            <button 
              type="button"
              className={cn(
                "p-2 transition-colors relative z-50",
                isScrolled ? "hover:text-primary text-foreground" : "hover:text-white/80 text-white"
              )}
              onClick={async (e) => {
                e.preventDefault()
                e.stopPropagation()
                
                // Verificar autenticação via localStorage primeiro (mais rápido e confiável)
                let authenticated = false;
                try {
                  const authStorage = localStorage.getItem('auth-storage');
                  if (authStorage) {
                    const parsed = JSON.parse(authStorage);
                    authenticated = !!(parsed?.state?.accessToken && parsed?.state?.customer);
                  }
                } catch {
                  // Ignorar erro de parse
                }
                
                // Se não encontrou no localStorage, tentar via store
                if (!authenticated) {
                  try {
                    const authStoreModule = await import('../../../../../lib/store/useAuthStore');
                    const authState = authStoreModule.useAuthStore.getState();
                    authenticated = !!(authState.accessToken && authState.customer);
                  } catch {
                    // Ignorar erro
                  }
                }
                
                if (authenticated) {
                  // Se autenticado, redirecionar para página de lista de desejos
                  window.location.href = '/minha-conta/lista-desejos';
                } else {
                  // Se não autenticado, redirecionar para login
                  window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
                }
              }}
              onMouseDown={(e) => {
                e.preventDefault()
                e.stopPropagation()
              }}
            >
              <Heart size={20} />
              {isAuthenticated && favoritesCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium">
                  {favoritesCount > 9 ? '9+' : favoritesCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setIsOpen(true)}
              className={cn(
                "p-2 transition-colors relative",
                isScrolled ? "hover:text-primary text-foreground" : "hover:text-white/80 text-white"
              )}
            >
              <ShoppingBag size={20} />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium">
                  {itemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Overlay escuro quando menu está aberto */}
      {isMobileMenuOpen && (
        <div
          className="xl:hidden fixed inset-0 bg-black/50 z-30 transition-opacity duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile/Tablet Menu */}
      <div
        className={cn(
          "xl:hidden fixed top-0 bottom-0 left-0 w-[280px] bg-[#F5F1EB] z-40 transition-transform duration-300 shadow-xl",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <nav className="flex flex-col h-full overflow-y-auto pt-16" style={{ overflowX: 'visible' }}>
          {/* Seção de Login/Conta */}
          {hasHydrated && (
            <>
              <div className="px-4 pb-4">
                {!isAuthenticated ? (
                  <>
                    <h2 className="text-lg font-bold text-foreground mb-2">OLÁ!</h2>
                    <p className="text-sm text-foreground/80 mb-4">
                      ENTRE OU CADASTRE-SE NA SUA CONTA
                    </p>
                    <Link
                      href="/login"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block w-full"
                    >
                      <button
                        className="w-full bg-primary text-primary-foreground py-3 px-4 rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors"
                        data-modal-button="true"
                      >
                        ENTRAR
                      </button>
                    </Link>
                  </>
                ) : (
                  <>
                    <h2 className="text-lg font-bold text-foreground mb-2">OLÁ!</h2>
                    <p className="text-sm text-foreground/80 mb-4">
                      ACESSE SUA CONTA
                    </p>
                    <Link
                      href="/minha-conta"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block w-full"
                    >
                      <button
                        className="w-full bg-primary text-primary-foreground py-3 px-4 rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors"
                        data-modal-button="true"
                      >
                        MINHA CONTA
                      </button>
                    </Link>
                  </>
                )}
              </div>

              {/* Linha Separadora */}
              <div className="border-t border-border/40 mx-4" />
            </>
          )}

          {/* Menu Dinâmico Mobile */}
          <div className="flex-1 py-4" style={{ overflowX: 'visible', position: 'relative', zIndex: 1 }}>
            <DynamicMenu 
              className="flex flex-col gap-0" 
              isMobile={true}
              onItemClick={() => setIsMobileMenuOpen(false)}
            />
          </div>
        </nav>
      </div>
    </header>
  );
}

Header.craft = {
  displayName: 'Header',
  props: {},
  isCanvas: true,
  rules: {
    canMoveIn: () => false,
    canMoveOut: () => false,
  },
}
