'use client'

import Link from "next/link";
import { ArrowRight, X, Search, Settings } from "lucide-react";
import { ProductCard } from "../product/ProductCard";
import { Product } from "../../data/products";
import { useSafeNode } from "../../lib/hooks/use-safe-node";
import { EditableText } from "../common/editable-text";
import { Element, useNode, useEditor } from '@craftjs/core';
import { useEffect, useState, useRef } from "react";
import { createPortal } from 'react-dom';

// Componente helper para renderizar texto editável ou texto simples
function EditableTextOrPlain({ 
  id, 
  content, 
  tag = 'span', 
  className = '' 
}: { 
  id: string
  content: string
  tag?: 'span' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'div'
  className?: string
}) {
  // Tentar usar Craft.js - se falhar, renderizar texto simples
  try {
    useEditor(); // Verificar se está no contexto
    const Tag = tag as keyof JSX.IntrinsicElements;
    return (
      <Element
        id={id}
        is={EditableText}
        tag={tag}
        className={className}
        content={content}
      />
    );
  } catch {
    // Fora do contexto do Craft.js - renderizar texto simples
    const Tag = tag as keyof JSX.IntrinsicElements;
    return <Tag className={className}>{content}</Tag>;
  }
}

interface ProductShowcaseProps {
  title: string;
  subtitle?: string;
  products?: Product[];
  viewAllLink?: string;
  viewAllText?: string;
}

export function ProductShowcase({
  title,
  subtitle,
  products: productsProp,
  viewAllLink,
  viewAllText = "Ver Todos",
}: ProductShowcaseProps) {
  const { connectors: { connect } } = useSafeNode();
  const [products, setProducts] = useState<Product[]>(productsProp || []);
  const [mounted, setMounted] = useState(false);
  
  // Obter nodeId e props do Craft.js
  let nodeId = 'product_showcase';
  let craftProps: { selectedProductIds?: string[] } = {};
  let nodeActions: { setProp: (callback: (props: any) => void) => void } | null = null;
  let isSelected = false;
  let isInEditor = false;
  
  try {
    const node = useNode((node) => ({
      selectedProductIds: node.data.props.selectedProductIds || [],
      isSelected: node.events.selected,
    }));
    const fullNode = useNode();
    nodeId = fullNode.id;
    craftProps = { selectedProductIds: node.selectedProductIds };
    nodeActions = fullNode.actions;
    isSelected = node.isSelected;
    isInEditor = true;
    console.log('[ProductShowcase] Props do Craft.js obtidas:', {
      selectedProductIds: craftProps.selectedProductIds,
      nodeId,
      isInEditor
    });
  } catch (e) {
    // Não está no contexto do editor - tentar obter props do layout salvo
    console.log('[ProductShowcase] Não está no contexto do Craft.js, tentando obter props do layout salvo');
  }
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  const setProp = nodeActions?.setProp || (() => {});

  // Função auxiliar para obter storeId
  const getStoreId = (): string | null => {
    // Tentar obter do usuário autenticado (no editor)
    if (typeof window !== 'undefined') {
      try {
        const authStorage = localStorage.getItem('auth-storage');
        if (authStorage) {
          const parsed = JSON.parse(authStorage);
          const storeId = parsed?.state?.user?.storeId || parsed?.state?.activeStoreId || null;
          if (storeId) {
            return storeId;
          }
        }
      } catch (e) {
        // Ignorar erro
      }
    }
    
    // Fallback para variável de ambiente
    return process.env.NEXT_PUBLIC_STORE_ID || null;
  };

  // Buscar produtos APENAS se foram selecionados manualmente no editor
  // Funciona tanto no editor quanto na página final
  useEffect(() => {
    // Se tiver produtos selecionados, buscar eles (funciona no editor e na página)
    if (craftProps.selectedProductIds && craftProps.selectedProductIds.length > 0) {
      // Buscar produtos selecionados da API
      const loadSelectedProducts = async () => {
        try {
          const storeId = getStoreId();
          if (!storeId) {
            console.warn('[ProductShowcase] Não foi possível obter storeId para carregar produtos selecionados');
            setProducts([]);
            return;
          }
          
          // Fazer requisição direta com fetch para garantir que o header x-store-id seja enviado
          const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
          console.log('[ProductShowcase] Buscando produtos selecionados da API...', { 
            storeId, 
            selectedIds: craftProps.selectedProductIds,
            isInEditor 
          });
          
          const response = await fetch(`${API_URL}/products?limit=100`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'x-store-id': storeId,
            },
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error('[ProductShowcase] Erro ao buscar produtos selecionados:', response.status, errorText);
            setProducts([]);
            return;
          }

          const data = await response.json();
          const responseData = data as { products?: any[] };
          
          if (responseData?.products) {
            const selectedProducts = responseData.products
              .filter((p: any) => craftProps.selectedProductIds!.includes(String(p.id)))
              .map((p: any) => ({
                id: String(p.id),
                slug: p.slug, // Incluir slug do produto
                name: p.name,
                price: parseFloat(p.base_price || '0'),
                images: p.main_image ? [p.main_image] : [],
                category: p.category_name || 'Geral',
                sizes: [],
                colors: [],
                description: p.description || '',
              } as Product));
            
            // Manter ordem dos IDs selecionados
            const orderedProducts = craftProps.selectedProductIds!
              .map((id) => selectedProducts.find((p) => p.id === id))
              .filter((p): p is Product => p !== undefined);
            
            console.log(`[ProductShowcase] ${orderedProducts.length} produtos selecionados carregados (editor: ${isInEditor})`);
            setProducts(orderedProducts);
            return;
          }
          
          setProducts([]);
        } catch (error) {
          console.warn('[ProductShowcase] Erro ao carregar produtos selecionados:', error);
          setProducts([]);
        }
      };
      
      loadSelectedProducts();
      return;
    }
    
    // Se produtos foram passados como prop, usar eles
    if (productsProp && productsProp.length > 0) {
      setProducts(productsProp);
      return;
    }

    // Se não houver produtos selecionados, não buscar automaticamente
    // Apenas mostrar array vazio (tanto no editor quanto na página)
    console.log('[ProductShowcase] Nenhum produto selecionado, não buscando produtos automaticamente');
    setProducts([]);
  }, [productsProp, isInEditor, craftProps.selectedProductIds]);

  // Garantir que products seja sempre um array
  const safeProducts = Array.isArray(products) ? products : [];

  // Estado para controlar abertura do modal
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  
  // Verificar se está no editor através da URL
  const [isInEditorRoute, setIsInEditorRoute] = useState(false);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsInEditorRoute(window.location.pathname.includes('/editor'));
    }
  }, []);

  // Renderizar modal de configurações apenas no editor
  const settingsModal = showSettingsModal && isInEditor && isInEditorRoute && mounted ? (
    <ProductShowcaseSettings
      selectedProductIds={craftProps.selectedProductIds || []}
      onProductIdsChange={(ids) => {
        setProp((props: any) => {
          props.selectedProductIds = ids;
        });
      }}
      onClose={() => setShowSettingsModal(false)}
      isOpen={showSettingsModal}
    />
  ) : null;

  return (
    <>
      {settingsModal}
    <section ref={(ref: HTMLElement | null) => { if (ref) connect(ref); }} className="py-16 lg:py-24 relative">
      {/* Botão para abrir configurações - apenas no editor */}
      {isInEditor && isInEditorRoute && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowSettingsModal(true);
          }}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 hover:bg-white shadow-lg flex items-center justify-center transition-all z-10 group/btn"
          title="Configurar produtos"
        >
          <Settings className="w-5 h-5 text-gray-700 group-hover/btn:text-primary transition-colors" />
        </button>
      )}
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          {subtitle && (
            <EditableTextOrPlain
              id={`${nodeId}_subtitle`}
              content={subtitle}
              tag="span"
              className="text-primary text-xs tracking-[0.3em] uppercase font-body mb-3 block"
            />
          )}
          <h2 className="font-display text-3xl lg:text-4xl text-foreground mb-4">
            <EditableTextOrPlain
              id={`${nodeId}_title`}
              content={title}
              tag="span"
              className=""
            />
          </h2>
          <div className="w-20 h-0.5 bg-gold mx-auto" />
        </div>

        {/* Products Grid */}
        {safeProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
            {safeProducts.map((product, index) => (
              <div
                key={product.id}
                className="animate-fade-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">
            <p className="text-sm">Nenhum produto disponível</p>
          </div>
        )}

        {/* View All */}
        {viewAllLink && (
          <div className="text-center mt-12">
            <Link
              href={viewAllLink}
              className="inline-flex items-center gap-2 text-foreground font-body text-sm tracking-wider uppercase hover:text-primary transition-colors group"
            >
              <EditableTextOrPlain
                id={`${nodeId}_view_all`}
                content={viewAllText}
                tag="span"
                className=""
              />
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        )}
      </div>
    </section>
    </>
  );
}

// Componente de Settings para selecionar produtos
function ProductShowcaseSettings({
  selectedProductIds,
  onProductIdsChange,
  onClose,
  isOpen,
}: {
  selectedProductIds: string[];
  onProductIdsChange: (ids: string[]) => void;
  onClose: () => void;
  isOpen: boolean;
}) {
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Só carregar produtos quando o modal estiver aberto
    if (!isOpen) {
      return;
    }
    
    console.log('[ProductShowcaseSettings] Modal aberto, iniciando carregamento de produtos...');
    
    // Verificar se está no editor
    if (typeof window === 'undefined') {
      setIsLoading(false);
      return;
    }
    
    const isInEditor = window.location.pathname.includes('/editor');
    if (!isInEditor) {
      console.log('[ProductShowcaseSettings] Não está no editor, não carregando produtos');
      setIsLoading(false);
      return;
    }
    
    const loadProducts = async () => {
      setIsLoading(true);
      try {
        // Obter storeId do usuário autenticado (no editor)
        let storeId: string | null = null;
        
        // Tentar obter do localStorage (auth-storage do Zustand)
        try {
          const authStorage = localStorage.getItem('auth-storage');
          if (authStorage) {
            const parsed = JSON.parse(authStorage);
            storeId = parsed?.state?.user?.storeId || parsed?.state?.activeStoreId || null;
            console.log('[ProductShowcaseSettings] StoreId obtido do auth-storage:', storeId);
          }
        } catch (e) {
          console.warn('[ProductShowcaseSettings] Erro ao ler auth-storage:', e);
        }
        
        // Fallback para variável de ambiente
        if (!storeId) {
          storeId = process.env.NEXT_PUBLIC_STORE_ID || null;
          console.log('[ProductShowcaseSettings] Usando NEXT_PUBLIC_STORE_ID:', storeId);
        }
        
        // Usar fetch diretamente, igual ao endpoint /products
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
        
        console.log('[ProductShowcaseSettings] Verificando configuração...', { API_URL, storeId });
        
        if (!storeId) {
          console.warn('[ProductShowcaseSettings] StoreId não encontrado nem no usuário nem em variável de ambiente');
          setIsLoading(false);
          return;
        }

        const url = `${API_URL}/products?limit=100`;
        console.log('[ProductShowcaseSettings] Fazendo requisição para:', url);
        console.log('[ProductShowcaseSettings] Headers:', { 'x-store-id': storeId });
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'x-store-id': storeId,
          },
        });

        console.log('[ProductShowcaseSettings] Status da resposta:', response.status, response.statusText);
        console.log('[ProductShowcaseSettings] Headers da resposta:', Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
          const errorText = await response.text();
          console.error('[ProductShowcaseSettings] Erro na resposta:', response.status, errorText);
          throw new Error(`API Error: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('[ProductShowcaseSettings] Resposta da API recebida:', {
          hasProducts: !!data?.products,
          productsCount: data?.products?.length || 0,
          dataKeys: Object.keys(data || {}),
          firstProduct: data?.products?.[0],
          fullData: data
        });

        if (data?.products && Array.isArray(data.products)) {
          console.log(`[ProductShowcaseSettings] ✅ ${data.products.length} produtos carregados com sucesso`);
          setAllProducts(data.products);
        } else if (Array.isArray(data)) {
          // Se a resposta for um array direto (sem wrapper products)
          console.log(`[ProductShowcaseSettings] ✅ ${data.length} produtos carregados (array direto)`);
          setAllProducts(data);
        } else {
          console.warn('[ProductShowcaseSettings] ⚠️ Nenhum produto na resposta ou formato inválido', data);
          setAllProducts([]);
        }
      } catch (error: any) {
        console.error('[ProductShowcaseSettings] ❌ Erro ao carregar produtos:', {
          message: error?.message,
          stack: error?.stack,
          error
        });
        setAllProducts([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadProducts();
  }, [isOpen]);

  const filteredProducts = allProducts.filter((product) =>
    product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleProduct = (productId: string) => {
    const id = String(productId);
    if (selectedProductIds.includes(id)) {
      onProductIdsChange(selectedProductIds.filter((pid) => pid !== id));
    } else {
      onProductIdsChange([...selectedProductIds, id]);
    }
  };

  const modalContent = (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 z-[9998] bg-black/50"
        style={{ pointerEvents: 'none' }}
      />
      {/* Modal */}
      <div
        ref={modalRef}
        className="fixed z-[9999] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl max-h-[90vh] bg-white rounded-lg shadow-2xl border-2 border-blue-500 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Selecionar Produtos</h3>
            <p className="text-sm text-gray-500 mt-1">
              Escolha os produtos que aparecerão nesta seção ({selectedProductIds.length} selecionados)
            </p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onClose();
            }}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar produtos por nome ou SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Products List */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="text-center py-12 text-gray-400">
              <p>Carregando produtos...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p>Nenhum produto encontrado</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredProducts.map((product) => {
                const isSelected = selectedProductIds.includes(String(product.id));
                return (
                  <div
                    key={product.id}
                    onClick={() => toggleProduct(product.id)}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        {product.main_image ? (
                          <img
                            src={product.main_image}
                            alt={product.name}
                            className="w-16 h-16 object-cover rounded"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                            <span className="text-gray-400 text-xs">Sem imagem</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 truncate">{product.name}</h4>
                        <p className="text-sm text-gray-500 mt-1">
                          {product.sku && `SKU: ${product.sku}`}
                        </p>
                        <p className="text-sm font-semibold text-gray-900 mt-1">
                          R$ {parseFloat(product.base_price || '0').toFixed(2)}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <div
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                            isSelected
                              ? 'bg-blue-500 border-blue-500'
                              : 'border-gray-300'
                          }`}
                        >
                          {isSelected && (
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <p className="text-xs text-gray-500 text-center">
            {selectedProductIds.length} produto(s) selecionado(s). Os produtos aparecerão na ordem selecionada.
          </p>
        </div>
      </div>
    </>
  );

  return typeof document !== 'undefined' 
    ? createPortal(modalContent, document.body)
    : null;
}

ProductShowcase.craft = {
  displayName: 'Product Showcase',
  props: {
    title: 'Novidades',
    subtitle: 'Acabaram de Chegar',
    viewAllLink: '/produtos?filter=new',
    viewAllText: 'Ver Todos',
    selectedProductIds: [], // IDs dos produtos selecionados
  },
  isCanvas: true,
  rules: {
    canMoveIn: () => false,
    canMoveOut: () => false,
  },
}
