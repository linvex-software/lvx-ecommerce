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
      className={`${isInEditor ? '' : 'sticky top-0'} z-50 bg-background/95 backdrop-blur-md border-b border-border`}
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
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 -ml-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            {theme?.logo_url ? (
              <img
                src={theme.logo_url}
                alt="Logo"
                className="h-8 lg:h-10 object-contain"
              />
            ) : (
              <h1 className="font-display text-2xl lg:text-3xl font-semibold text-foreground tracking-wide">
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
          <nav className="hidden lg:flex items-center gap-8">
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

          {/* Actions */}
          <div className="flex items-center gap-2 lg:gap-4">
            <Link href="/busca" className="p-2 hover:text-primary transition-colors">
              <Search size={20} />
            </Link>
            <Link href="/conta" className="p-2 hover:text-primary transition-colors hidden sm:block">
              <User size={20} />
            </Link>
            <button className="p-2 hover:text-primary transition-colors hidden sm:block">
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
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={cn(
          "lg:hidden fixed inset-0 top-[104px] bg-background z-40 transition-transform duration-300",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <nav className="flex flex-col p-6 gap-4">
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
          <div className="flex gap-4 mt-6">
            <Link href="/conta" className="flex items-center gap-2 text-foreground">
              <User size={20} />
              <span>Minha Conta</span>
            </Link>
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
