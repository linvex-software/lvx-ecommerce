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
  const Tag = tag as keyof JSX.IntrinsicElements;

  // Se estiver no contexto do Craft.js, usar Element
  // Usar useMemo para evitar re-renderizações desnecessárias
  const editableContent = React.useMemo(() => {
    if (isInCraftContext) {
      return (
        <Element
          id={id}
          is={EditableText}
          tag={tag}
          className={className}
          content={content}
        />
      );
    }
    return null;
  }, [isInCraftContext, id, tag, className, content]);

  // Se estiver no contexto do Craft.js, usar Element
  if (isInCraftContext && editableContent) {
    return editableContent;
  }

  // Fora do contexto do Craft.js - renderizar texto simples
  return <Tag className={className}>{content}</Tag>;
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

  // Verificar se está no contexto do Craft.js usando hook de forma segura
  const [isInCraftContext, setIsInCraftContext] = React.useState(false);
  
  React.useEffect(() => {
    // Verificar se está no contexto do Craft.js de forma segura
    try {
      useEditor();
      setIsInCraftContext(true);
    } catch {
      setIsInCraftContext(false);
    }
  }, []);

  // Menu dinâmico será carregado pelo DynamicMenu

  return (
    <header
      ref={(ref: HTMLElement | null) => { if (ref) connect(ref) }}
      className={`${isInEditor ? '' : 'sticky top-0'} bg-background/95 backdrop-blur-md border-b border-border`}
      style={{
        zIndex: isInEditor ? 1 : (isCartOpen ? 9998 : 9999),
        position: isInEditor ? 'relative' : 'sticky',
      }}
    >
      {/* Top Bar */}
      <div className="bg-primary text-primary-foreground text-center py-2 text-xs tracking-widest font-body">
        <EditableTextOrPlain
          id="node_header_topbar"
          content="FRETE GRÁTIS PARA COMPRAS ACIMA DE R$ 299"
          tag="span"
          className=""
          isInCraftContext={isInCraftContext}
        />
      </div>

      {/* Main Header */}
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 xl:h-20">
          {/* Logo - à esquerda no mobile/tablet */}
          <Link href="/" className="flex-shrink-0">
            {theme?.logo_url ? (
              <img
                src={theme.logo_url}
                alt="Logo"
                className="h-8 xl:h-10 object-contain"
              />
            ) : (
              <h1 className="font-display text-2xl xl:text-3xl font-semibold text-foreground tracking-wide">
                {settings?.name || "Minha Loja"}
              </h1>
            )}
          </Link>

          {/* Desktop Navigation - Menu Dinâmico */}
          <nav className="hidden xl:flex items-center gap-8">
            <DynamicMenu className="flex items-center gap-8" isMobile={false} />
          </nav>

          {/* Actions - Desktop only */}
          <div className="hidden xl:flex items-center gap-2 xl:gap-4">
            <Link href="/busca" className="p-2 hover:text-primary transition-colors">
              <Search size={20} />
            </Link>
            <Link href="/minha-conta" className="p-2 hover:text-primary transition-colors">
              <User size={20} />
            </Link>
            {/* Favoritos - Sempre visível */}
            <button 
              type="button"
              className="p-2 hover:text-primary transition-colors relative z-50"
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
              className="p-2 hover:text-primary transition-colors relative"
            >
              <ShoppingBag size={20} />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium">
                  {itemCount}
                </span>
              )}
            </button>
          </div>

          {/* Mobile/Tablet Menu Button - à direita no mobile/tablet */}
          <button
            className="xl:hidden p-2 -mr-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile/Tablet Menu */}
      <div
        className={cn(
          "xl:hidden fixed inset-0 top-[104px] bg-background z-40 transition-transform duration-300",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <nav className="flex flex-col p-6 gap-4 bg-white" style={{ transform: 'translateY(-10px)' }}>
          {/* Menu Dinâmico Mobile */}
          <DynamicMenu 
            className="flex flex-col gap-0" 
            isMobile={true}
            onItemClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Mobile Actions - com separadores iguais aos outros itens */}
          <button
            onClick={() => {
              setIsOpen(true)
              setIsMobileMenuOpen(false)
            }}
            className="flex items-center gap-2 text-lg font-body py-3 border-b border-border text-foreground hover:text-primary transition-colors"
          >
            <ShoppingBag size={20} />
            <span>Carrinho</span>
            {itemCount > 0 && (
              <span className="ml-auto bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full font-medium">
                {itemCount}
              </span>
            )}
          </button>
          <Link
            href="/busca"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center gap-2 text-lg font-body py-3 border-b border-border text-foreground hover:text-primary transition-colors"
          >
            <Search size={20} />
            <span>Pesquisar</span>
          </Link>
          <Link
            href={hasHydrated && isAuthenticated ? "/minha-conta" : "/login"}
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center gap-2 text-lg font-body py-3 border-b border-border text-foreground hover:text-primary transition-colors"
          >
            <User size={20} />
            <span>{hasHydrated && isAuthenticated ? "Minha Conta" : "Fazer login"}</span>
          </Link>
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
