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
import { useQuery } from '@tanstack/react-query';
import React from 'react';

interface Category {
  id: string
  name: string
  slug: string
}

interface CategoriesResponse {
  categories: Category[]
}

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

  // Fora do contexto do Craft.js - renderizar texto simples
  return <Tag className={className}>{content}</Tag>;
}

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { itemCount, setIsOpen } = useCart();
  const { connectors: { connect }, isInEditor } = useSafeNode();
  const { data: theme } = useStoreTheme();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasHydrated, setHasHydrated] = useState(true);

  // Carregar hooks de autenticação apenas no contexto web (runtime)
  useEffect(() => {
    // Verificar se estamos no contexto web (não admin)
    // No admin, o pathname pode ser /editor ou similar
    if (typeof window === 'undefined') {
      return; // SSR, não fazer nada
    }

    const isWebContext = !window.location.pathname.includes('/editor');
    
    if (!isWebContext) {
      // No admin, não tentar carregar autenticação de cliente
      return;
    }

    // Usar uma função assíncrona para carregar o módulo apenas no runtime
    // O caminho relativo é calculado a partir da estrutura de diretórios:
    // Header.tsx está em: components/template/flor-de-menina/components/layout/
    // useAuthStore.ts está em: lib/store/
    // Caminho relativo: ../../../../lib/store/useAuthStore
    (async () => {
      try {
        // Usar caminho relativo que só existe no contexto web
        // O Next.js não consegue resolver caminhos relativos dinâmicos no build time
        // @ts-expect-error - Este módulo só existe no contexto web, não no admin
        const authStoreModule = await import('../../../../lib/store/useAuthStore');
        
        // Criar uma função que verifica o estado atual
        const checkAuth = () => {
          const authState = authStoreModule.useAuthStore.getState();
          setIsAuthenticated(!!(authState.accessToken && authState.customer));
          setHasHydrated(authState._hasHydrated);
        };
        
        // Verificar inicialmente
        checkAuth();
        
        // Subscrever a mudanças no store
        const unsubscribe = authStoreModule.useAuthStore.subscribe(checkAuth);
        
        // Retornar função de cleanup
        return () => unsubscribe();
      } catch (error) {
        // Se não conseguir importar (ex: no admin), usar valores padrão
        setIsAuthenticated(false);
        setHasHydrated(true);
      }
    })();
  }, []);
  
  // Verificar se está no contexto do Craft.js uma vez
  let isInCraftContext = false;
  try {
    useEditor();
    isInCraftContext = true;
  } catch {
    isInCraftContext = false;
  }
  
  // Função helper para buscar categorias (funciona em web e admin)
  const fetchCategories = async (): Promise<CategoriesResponse> => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'
    const storeId = process.env.NEXT_PUBLIC_STORE_ID
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    
    if (storeId) {
      headers['x-store-id'] = storeId
    }
    
    const response = await fetch(`${API_URL}/categories`, { headers })
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`)
    }
    
    return response.json()
  }

  // Buscar categorias da API
  const { data: categoriesData } = useQuery<CategoriesResponse>({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  })

  // Gerar links de navegação dinamicamente
  const navLinks = useMemo(() => {
    const staticLinks = [
      { name: "Novidades", href: "/produtos?filter=new", id: "node_header_nav_1" },
    ]
    
    // Adicionar categorias da API (máximo 5 para não sobrecarregar o menu)
    const categoryLinks = (categoriesData?.categories || []).slice(0, 5).map((cat, index) => ({
      name: cat.name,
      href: `/produtos?category_id=${cat.id}`,
      id: `node_header_nav_category_${cat.id}`, // Usar ID da categoria para garantir unicidade
    }))
    
    // Adicionar link estático no final
    const finalLinks = [
      { name: "Natal & Festas", href: "/produtos?filter=featured", id: "node_header_nav_featured" },
    ]
    
    return [...staticLinks, ...categoryLinks, ...finalLinks]
  }, [categoriesData])
  
  // Verificar se está no contexto do Craft.js
  let craftContextAvailable = false;
  try {
    useEditor();
    craftContextAvailable = true;
  } catch {
    craftContextAvailable = false;
  }

  return (
    <header 
      ref={(ref: HTMLElement | null) => { if (ref) connect(ref) }} 
      className={`${isInEditor ? '' : 'sticky top-0'} bg-background/95 backdrop-blur-md border-b border-border`}
      style={{
        zIndex: isInEditor ? 1 : 9999,
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
                <EditableTextOrPlain
                  id="node_header_logo"
                  content="Flor de Menina"
                  tag="span"
                  className=""
                  isInCraftContext={isInCraftContext}
                />
              </h1>
            )}
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden xl:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.id}
                href={link.href}
                className="text-sm font-body tracking-wide text-foreground/80 hover:text-primary transition-colors duration-200 relative group"
              >
                <EditableTextOrPlain
                  id={link.id}
                  content={link.name}
                  tag="span"
                  className=""
                  isInCraftContext={isInCraftContext}
                />
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
              </Link>
            ))}
          </nav>

          {/* Actions - Desktop only */}
          <div className="hidden xl:flex items-center gap-2 xl:gap-4">
            <Link href="/busca" className="p-2 hover:text-primary transition-colors">
              <Search size={20} />
            </Link>
            <Link href="/minha-conta" className="p-2 hover:text-primary transition-colors">
              <User size={20} />
            </Link>
            <button className="p-2 hover:text-primary transition-colors">
              <Heart size={20} />
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
          {navLinks.map((link) => (
            <Link
              key={link.id}
              href={link.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-lg font-body py-3 border-b border-border text-foreground hover:text-primary transition-colors"
            >
              <EditableTextOrPlain
                id={link.id}
                content={link.name}
                tag="span"
                className=""
                isInCraftContext={isInCraftContext}
              />
            </Link>
          ))}
          
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
