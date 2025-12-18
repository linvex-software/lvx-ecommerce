'use client'

import React, { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { ImagePlus, ChevronLeft, ChevronRight, Settings, X, Search } from "lucide-react";
import { useSafeNode } from "../../lib/hooks/use-safe-node";
import { EditableText } from "../common/editable-text";
import { useNode, Element } from '@craftjs/core';
import { useQuery } from '@tanstack/react-query';
import { createPortal } from 'react-dom';

// Componente para botão de upload de imagem
function ImageUploadButton({ 
  onUpload, 
  className = "absolute top-2 right-2" 
}: { 
  onUpload: () => void
  className?: string 
}) {
  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onUpload();
      }}
      className={`${className} w-10 h-10 rounded-full bg-white/90 hover:bg-white shadow-lg flex items-center justify-center transition-all z-10 group/btn`}
      title="Alterar imagem"
    >
      <ImagePlus className="w-5 h-5 text-gray-700 group-hover/btn:text-primary transition-colors" />
    </button>
  );
}

interface Category {
  id: string
  name: string
  slug: string
  icon?: string | null
}

interface CategoriesResponse {
  categories: Category[]
}

// Imagens padrão para categorias (fallback)
const DEFAULT_CATEGORY_IMAGES = [
  "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&h=800&fit=crop",
  "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=600&h=800&fit=crop",
  "https://images.unsplash.com/photo-1591369822096-ffd140ec948f?w=600&h=800&fit=crop",
];

export function CategoryBanner({ children: craftChildren }: { children?: React.ReactNode }) {
  const safeNode = useSafeNode();
  const { connectors } = safeNode;
  const { connect } = connectors;
  const isInEditor = 'isInEditor' in safeNode ? safeNode.isInEditor : false;
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [showButtons, setShowButtons] = useState(false);
  
  // Verificar se está no editor através da URL
  const [isInEditorRoute, setIsInEditorRoute] = React.useState(false);
  
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsInEditorRoute(window.location.pathname.includes('/editor'));
    }
  }, []);
  
  // Obter props do Craft.js
  let craftProps: { 
    categoryImages?: string[];
    selectedCategoryIds?: string[];
  } = {};
  let nodeActions: { setProp: (callback: (props: any) => void) => void } | null = null;
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  try {
    const node = useNode((node) => ({
      categoryImages: node.data.props.categoryImages || [],
      selectedCategoryIds: node.data.props.selectedCategoryIds || [],
    }));
    const fullNode = useNode();
    craftProps = { 
      categoryImages: node.categoryImages,
      selectedCategoryIds: node.selectedCategoryIds,
    };
    nodeActions = fullNode.actions;
    console.log('[CategoryBanner] Props do Craft.js obtidas:', {
      selectedCategoryIds: craftProps.selectedCategoryIds,
      categoryImagesCount: craftProps.categoryImages?.length || 0,
      isInEditor
    });
  } catch (e) {
    // Não está no contexto do editor - tentar obter props do layout salvo
    console.log('[CategoryBanner] Não está no contexto do Craft.js, tentando obter props do layout salvo');
  }
  
  const setProp = nodeActions?.setProp || (() => {});
  
  const handleCategoryIdsChange = (ids: string[]) => {
    setProp((props: any) => {
      props.selectedCategoryIds = ids;
    });
  };

  // Função helper para obter storeId (funciona em web e admin)
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

  // Função helper para buscar categorias (funciona em web e admin)
  const fetchCategories = async (): Promise<CategoriesResponse> => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'
    const storeId = getStoreId()
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    
    if (storeId) {
      headers['x-store-id'] = storeId
    }
    
    console.log('[CategoryBanner] Buscando categorias da API...', { storeId, API_URL });
    
    const response = await fetch(`${API_URL}/categories`, { headers })
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[CategoryBanner] Erro ao buscar categorias:', response.status, errorText);
      throw new Error(`API Error: ${response.statusText}`)
    }
    
    const data = await response.json();
    console.log('[CategoryBanner] Categorias recebidas da API:', {
      count: data?.categories?.length || 0,
      categories: data?.categories?.map((c: any) => ({ id: c.id, name: c.name })) || []
    });
    
    return data
  }

  // Buscar categorias da API
  // Incluir storeId na queryKey para forçar refetch quando mudar
  const storeId = getStoreId();
  const { data: categoriesData, isLoading: isLoadingCategories } = useQuery<CategoriesResponse>({
    queryKey: ['categories', storeId],
    queryFn: fetchCategories,
    enabled: !!storeId, // Só buscar se tiver storeId
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
  })
  
  console.log('[CategoryBanner] Estado do useQuery:', {
    hasData: !!categoriesData,
    isLoading: isLoadingCategories,
    categoriesCount: categoriesData?.categories?.length || 0,
    storeId
  });

  // Usar APENAS categorias selecionadas no editor (não mostrar todas automaticamente)
  const categories = React.useMemo(() => {
    console.log('[CategoryBanner] Calculando categorias:', {
      selectedCategoryIds: craftProps.selectedCategoryIds,
      categoriesDataCount: categoriesData?.categories?.length || 0,
      hasCategoriesData: !!categoriesData
    });
    
    let categoriesToUse: Category[] = [];
    
    // Se houver categorias selecionadas no editor, usar apenas essas
    if (craftProps.selectedCategoryIds && craftProps.selectedCategoryIds.length > 0) {
      const allCategories = categoriesData?.categories || [];
      console.log('[CategoryBanner] Filtrando categorias selecionadas:', {
        selectedIds: craftProps.selectedCategoryIds,
        allCategoriesCount: allCategories.length,
        allCategoryIds: allCategories.map(c => c.id)
      });
      
      // Filtrar e manter ordem das selecionadas
      categoriesToUse = craftProps.selectedCategoryIds
        .map(id => {
          const found = allCategories.find(cat => String(cat.id) === String(id));
          if (!found) {
            console.warn(`[CategoryBanner] Categoria com ID ${id} não encontrada na lista de categorias`);
          }
          return found;
        })
        .filter(Boolean) as Category[];
      
      console.log('[CategoryBanner] Categorias filtradas:', {
        count: categoriesToUse.length,
        categories: categoriesToUse.map(c => ({ id: c.id, name: c.name }))
      });
    } else {
      console.log('[CategoryBanner] Nenhuma categoria selecionada');
    }
    // Se não houver seleção, não mostrar nenhuma categoria
    // O usuário deve selecionar manualmente no editor
    
    // Mapear para o formato esperado
    if (categoriesToUse.length > 0) {
      const mapped = categoriesToUse.map((cat, index) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        image: craftProps.categoryImages?.[index] || DEFAULT_CATEGORY_IMAGES[index % DEFAULT_CATEGORY_IMAGES.length],
        href: `/produtos?category_id=${cat.id}`,
        nodeId: `node_category_${index + 1}`,
      }));
      console.log('[CategoryBanner] Categorias mapeadas:', mapped.length);
      return mapped;
    }
    
    // Se não houver categorias selecionadas, retornar array vazio
    // O usuário deve selecionar categorias manualmente no editor
    console.log('[CategoryBanner] Retornando array vazio - nenhuma categoria selecionada');
    return []
  }, [categoriesData, craftProps.selectedCategoryIds, craftProps.categoryImages])

  // Debug: verificar se children estão chegando (sempre logar, não só fora do editor)
  React.useEffect(() => {
    console.log('[CategoryBanner] Props recebidas:', {
      hasChildren: !!craftChildren,
      childrenCount: craftChildren ? React.Children.count(craftChildren) : 0,
      isInEditor,
      children: craftChildren ? React.Children.toArray(craftChildren).map((child, idx) => {
        if (React.isValidElement(child)) {
          return {
            index: idx,
            type: child.type,
            id: (child.props as any)?.id,
            content: (child.props as any)?.content,
            props: child.props
          };
        }
        return { index: idx, type: 'invalid', value: child };
      }) : []
    });
  }, [craftChildren, isInEditor]);
  
  // Obter nodes filhos do Craft.js quando estiver no editor
  let nodeData: { childNodes: string[] } | null = null;
  
  try {
    const node = useNode((node) => ({
      childNodes: node.data.nodes || [],
    }));
    nodeData = node;
  } catch (e) {
    nodeData = null;
  }
  
  // Mapear nodes filhos do Craft.js por ID do texto (no editor)
  // E também mapear children do layout salvo por ID (fora do editor)
  const childNodesMap = React.useMemo(() => {
    const map = new Map<string, React.ReactNode>();
    
    if (craftChildren) {
      React.Children.forEach(craftChildren, (child, index) => {
        if (React.isValidElement(child)) {
          const childProps = child.props as any;
          const textId = childProps?.id;
          if (textId) {
            map.set(textId, child);
            console.log(`[CategoryBanner] Mapeando child ${index} com ID ${textId}:`, {
              type: child.type,
              id: childProps?.id,
              content: childProps?.content,
              className: childProps?.className,
              tag: childProps?.tag,
              allProps: childProps
            });
          } else {
            console.log(`[CategoryBanner] Child ${index} não tem ID:`, {
              type: child.type,
              props: childProps
            });
          }
        }
      });
    }
    
    return map;
  }, [craftChildren]);

  // Função auxiliar para renderizar um EditableText baseado no ID
  const renderEditableText = React.useCallback((id: string, defaultProps: any) => {
    // Usar o mapa de children (funciona tanto no editor quanto fora)
    if (childNodesMap.has(id)) {
      const foundChild = childNodesMap.get(id)!;
      console.log(`[CategoryBanner] ✅ Usando child do mapa para ${id}`);
      return foundChild;
    }
    
    // Se estiver no editor e não encontrou no mapa, criar novo node
    if (isInEditor) {
      const { id: _, ...propsWithoutId } = defaultProps;
      return (
        <Element 
          is={EditableText} 
          id={id} 
          canvas={false}
          {...propsWithoutId}
        />
      );
    }
    
    // Fora do editor e não encontrou no mapa, usar valores padrão
    console.log(`[CategoryBanner] ⚠️ Não encontrou child com ID ${id}, usando valores padrão`);
    return (
      <EditableText
        key={id}
        id={id}
        {...defaultProps}
      />
    );
  }, [isInEditor, childNodesMap]);

  // Função para lidar com upload de imagem
  const handleImageUpload = (categoryIndex: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione apenas arquivos de imagem (JPG, PNG, GIF).');
      return;
    }

    // Validar tamanho (máximo 10MB para base64)
    if (file.size > 10 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 10MB. Por favor, escolha uma imagem menor.');
      return;
    }

    // Converter para base64 (data URL) ao invés de blob URL
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      
      // Atualizar props do Craft.js
      setProp((props: any) => {
        const currentImages = props.categoryImages || [];
        const newImages = [...currentImages];
        newImages[categoryIndex] = imageUrl;
        props.categoryImages = newImages;
      });
    };
    reader.onerror = () => {
      alert('Erro ao processar imagem. Tente novamente.');
    };
    reader.readAsDataURL(file);
  };

  // Obter URL da imagem (do Craft.js ou padrão)
  const getImageUrl = (categoryIndex: number, defaultImage: string) => {
    if (isInEditor && craftProps.categoryImages?.[categoryIndex]) {
      return craftProps.categoryImages[categoryIndex];
    }
    return defaultImage;
  };

  // Verificar se há scroll disponível
  const checkScrollability = () => {
    if (!scrollContainerRef.current) return;
    
    const container = scrollContainerRef.current;
    const canScroll = container.scrollWidth > container.clientWidth;
    const hasScrollLeft = container.scrollLeft > 0;
    const hasScrollRight = container.scrollLeft < container.scrollWidth - container.clientWidth - 1;
    
    setCanScrollLeft(hasScrollLeft);
    setCanScrollRight(hasScrollRight);
    setShowButtons(canScroll);
  };

  // Verificar scroll ao montar e ao redimensionar
  useEffect(() => {
    // Aguardar um frame para garantir que o DOM foi renderizado
    const timeoutId = setTimeout(() => {
      checkScrollability();
    }, 100);
    
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollability);
      window.addEventListener('resize', checkScrollability);
      
      return () => {
        clearTimeout(timeoutId);
        container.removeEventListener('scroll', checkScrollability);
        window.removeEventListener('resize', checkScrollability);
      };
    }
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [categories.length]);

  // Função de easing suave (ease-in-out)
  const easeInOutCubic = (t: number): number => {
    return t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;
  };

  // Criar refs para os inputs de upload de imagem (um por categoria)
  const fileInputRefs = React.useRef<Map<number, HTMLInputElement>>(new Map());
  
  const setFileInputRef = (index: number) => (el: HTMLInputElement | null) => {
    if (el) {
      fileInputRefs.current.set(index, el);
    } else {
      fileInputRefs.current.delete(index);
    }
  };

  // Função de scroll suave customizada
  const smoothScrollTo = (element: HTMLElement, target: number, duration: number = 600) => {
    const start = element.scrollLeft;
    const distance = target - start;
    const startTime = performance.now();

    const animateScroll = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeInOutCubic(progress);
      
      element.scrollLeft = start + distance * easedProgress;

      if (progress < 1) {
        requestAnimationFrame(animateScroll);
      }
    };

    requestAnimationFrame(animateScroll);
  };

  // Funções de navegação
  const scrollLeft = () => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const cards = container.querySelectorAll('.category-card');
    if (cards.length === 0) return;

    const containerRect = container.getBoundingClientRect();
    const currentScroll = container.scrollLeft;
    let targetCard: Element | null = null;
    let closestDistance = Infinity;

    // Encontrar o card mais próximo à esquerda que está parcialmente ou totalmente fora da viewport
    cards.forEach((card) => {
      const cardRect = card.getBoundingClientRect();
      const cardLeft = cardRect.left - containerRect.left + currentScroll;
      
      // Se o card está à esquerda da posição atual de scroll
      if (cardLeft < currentScroll) {
        const distance = currentScroll - cardLeft;
        if (distance < closestDistance) {
          closestDistance = distance;
          targetCard = card;
        }
      }
    });

    // Se não encontrou, ir para o início
    const targetScroll = targetCard 
      ? (targetCard as HTMLElement).offsetLeft - containerRect.left
      : 0;

    smoothScrollTo(container, Math.max(0, targetScroll), 800);
  };

  const scrollRight = () => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const cards = container.querySelectorAll('.category-card');
    if (cards.length === 0) return;

    const currentScroll = container.scrollLeft;
    const containerWidth = container.clientWidth;
    const gap = 24; // gap-6 = 1.5rem = 24px
    
    // Encontrar o primeiro card que está completamente fora da viewport à direita
    let targetCard: HTMLElement | null = null;
    
    for (let i = 0; i < cards.length; i++) {
      const card = cards[i] as HTMLElement;
      const cardRect = card.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      
      // Posição do card relativa ao container
      const cardLeftRelative = cardRect.left - containerRect.left + currentScroll;
      
      // Se o card está completamente à direita da viewport
      if (cardLeftRelative > currentScroll + containerWidth) {
        targetCard = card;
        break;
      }
    }

    // Calcular o target scroll
    let targetScroll: number;
    if (targetCard) {
      const cardRect = targetCard.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      // Posição absoluta do card menos a posição do container
      targetScroll = cardRect.left - containerRect.left + currentScroll;
    } else {
      // Se não encontrou, ir para o final
      targetScroll = container.scrollWidth - containerWidth;
    }

    // Limitar o scroll máximo
    const maxScroll = Math.max(0, container.scrollWidth - containerWidth);
    targetScroll = Math.min(targetScroll, maxScroll);

    smoothScrollTo(container, Math.max(0, targetScroll), 800);
  };

  // Renderizar modal de configurações apenas no editor
  const settingsModal = showSettingsModal && isInEditor && isInEditorRoute && mounted ? (
    <CategoryBannerSettings
      selectedCategoryIds={craftProps.selectedCategoryIds || []}
      onCategoryIdsChange={handleCategoryIdsChange}
      onClose={() => setShowSettingsModal(false)}
      isOpen={showSettingsModal}
    />
  ) : null;

  return (
    <>
      {settingsModal}
    <section ref={(ref: HTMLElement | null) => { if (ref) connect(ref) }} className="py-16 bg-cream relative">
      {/* Botão para abrir configurações - apenas no editor */}
      {isInEditor && isInEditorRoute && mounted && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowSettingsModal(true);
          }}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 hover:bg-white shadow-lg flex items-center justify-center transition-all z-10 group/btn"
          title="Configurar categorias (máximo 3)"
        >
          <Settings className="w-5 h-5 text-gray-700 group-hover/btn:text-primary transition-colors" />
        </button>
      )}
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 relative">
          {renderEditableText("node_category_banner_subtitle", {
            tag: "span",
            className: "text-primary text-xs tracking-[0.3em] uppercase font-body mb-3 block",
            content: "Categorias"
          })}
          <h2 className="font-display text-3xl lg:text-4xl text-foreground">
            {renderEditableText("node_category_banner_title", {
              tag: "span",
              className: "",
              content: "Explore por Estilo"
            })}
          </h2>
          
          {/* Botões de navegação */}
          {showButtons ? (
            <div className={`absolute top-0 right-0 flex gap-2 transition-all duration-300 ease-out ${showButtons ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 pointer-events-none'}`}>
              <button
                onClick={scrollLeft}
                disabled={!canScrollLeft}
                className="group/btn w-10 h-10 flex items-center justify-center bg-white/90 hover:bg-white border border-gray-200 rounded transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:border-primary hover:scale-105 active:scale-95 shadow-lg"
                aria-label="Categoria anterior"
              >
                <ChevronLeft className="w-5 h-5 text-gray-700 transition-transform duration-300 group-hover/btn:-translate-x-0.5" />
              </button>
              <button
                onClick={scrollRight}
                disabled={!canScrollRight}
                className="group/btn w-10 h-10 flex items-center justify-center bg-white/90 hover:bg-white border border-gray-200 rounded transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:border-primary hover:scale-105 active:scale-95 shadow-lg"
                aria-label="Próxima categoria"
              >
                <ChevronRight className="w-5 h-5 text-gray-700 transition-transform duration-300 group-hover/btn:translate-x-0.5" />
              </button>
            </div>
          ) : null}
        </div>

        <div 
          ref={scrollContainerRef}
          className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth transition-all duration-300"
          style={{ 
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            scrollBehavior: 'smooth',
          }}
        >
          {categories.map((category, index) => {
            const imageUrl = getImageUrl(index, category.image);
            
            return (
              <div
                key={category.id}
                className="category-card group relative aspect-[3/4] overflow-hidden animate-fade-up flex-shrink-0 w-full min-w-[280px] md:min-w-0 md:w-[calc((100%-48px)/3)] md:max-w-[calc((100%-48px)/3)] transition-all duration-500 ease-in-out"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <Link
                  href={category.href}
                  className="block w-full h-full"
                >
                  <img
                    src={imageUrl}
                    alt={category.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-charcoal/60 via-transparent to-transparent" />
                </Link>
                
                {/* Botão de upload - apenas no editor */}
                {isInEditor && isInEditorRoute && (
                  <>
                    <input
                      ref={setFileInputRef(index)}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageUpload(index, e)}
                    />
                    <ImageUploadButton
                      onUpload={() => fileInputRefs.current.get(index)?.click()}
                      className="absolute top-2 right-2 z-20"
                    />
                  </>
                )}
                <div className="absolute bottom-0 left-0 right-0 p-6 text-center">
                  <h3 className="font-display text-2xl text-white mb-2">
                    {category.name}
                  </h3>
                  {renderEditableText(`${category.nodeId}_cta`, {
                    tag: "span",
                    className: "inline-block text-white/80 text-xs tracking-widest uppercase font-body border-b border-gold pb-1 group-hover:border-primary transition-colors",
                    content: "Ver Coleção"
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        
        /* Transições suaves para o scroll */
        .scrollbar-hide {
          scroll-behavior: smooth;
          -webkit-overflow-scrolling: touch;
        }
        
        /* Animação suave para os cards durante o scroll */
        .category-card {
          transition: transform 0.3s ease-out, opacity 0.3s ease-out;
        }
        
        /* Animação de entrada dos botões */
        @keyframes slideInFromRight {
          from {
            opacity: 0;
            transform: translateX(10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .animate-in {
          animation: slideInFromRight 0.3s ease-out;
        }
      `}</style>
    </section>
    </>
  );
}

// Componente de Settings para selecionar categorias
function CategoryBannerSettings({
  selectedCategoryIds,
  onCategoryIdsChange,
  onClose,
  isOpen,
}: {
  selectedCategoryIds: string[];
  onCategoryIdsChange: (ids: string[]) => void;
  onClose: () => void;
  isOpen: boolean;
}) {
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!isOpen) return;
    
    const loadCategories = async () => {
      setIsLoading(true);
      try {
        let storeId: string | null = null;
        
        // Tentar obter do localStorage (auth-storage do Zustand)
        try {
          const authStorage = localStorage.getItem('auth-storage');
          if (authStorage) {
            const parsed = JSON.parse(authStorage);
            storeId = parsed?.state?.user?.storeId || parsed?.state?.activeStoreId || null;
          }
        } catch (e) {
          console.warn('[CategoryBannerSettings] Erro ao ler auth-storage:', e);
        }
        
        // Fallback para variável de ambiente
        if (!storeId) {
          storeId = process.env.NEXT_PUBLIC_STORE_ID || null;
        }
        
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
        
        if (!storeId) {
          console.warn('[CategoryBannerSettings] StoreId não encontrado');
          setIsLoading(false);
          return;
        }

        const response = await fetch(`${API_URL}/categories`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'x-store-id': storeId,
          },
        });

        if (!response.ok) {
          throw new Error(`API Error: ${response.statusText}`);
        }

        const data = await response.json();
        
        if (data?.categories && Array.isArray(data.categories)) {
          setAllCategories(data.categories);
        } else if (Array.isArray(data)) {
          setAllCategories(data);
        } else {
          setAllCategories([]);
        }
      } catch (error: any) {
        console.error('[CategoryBannerSettings] Erro ao carregar categorias:', error);
        setAllCategories([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadCategories();
  }, [isOpen]);

  const filteredCategories = allCategories.filter((category) =>
    category.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.slug?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleCategory = (categoryId: string) => {
    const id = String(categoryId);
    if (selectedCategoryIds.includes(id)) {
      // Remover categoria
      onCategoryIdsChange(selectedCategoryIds.filter((cid) => cid !== id));
    } else {
      // Adicionar categoria, mas limitar a 3
      if (selectedCategoryIds.length >= 3) {
        // Não permitir adicionar mais de 3
        return;
      }
      onCategoryIdsChange([...selectedCategoryIds, id]);
    }
  };

  const modalContent = (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 z-[9998] bg-black/50"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
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
            <h3 className="text-lg font-semibold text-gray-900">Selecionar Categorias</h3>
            <p className="text-sm text-gray-500 mt-1">
              Escolha as categorias que aparecerão nesta seção ({selectedCategoryIds.length} selecionada{selectedCategoryIds.length !== 1 ? 's' : ''})
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
              placeholder="Buscar categorias por nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Categories List */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="text-center py-12 text-gray-400">
              <p>Carregando categorias...</p>
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p>Nenhuma categoria encontrada</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredCategories.map((category) => {
                const isSelected = selectedCategoryIds.includes(String(category.id));
                return (
                  <div
                    key={category.id}
                    onClick={() => toggleCategory(category.id)}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 cursor-pointer'
                        : selectedCategoryIds.length >= 3
                        ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50'
                        : 'border-gray-200 hover:border-gray-300 cursor-pointer'
                    }`}
                    title={selectedCategoryIds.length >= 3 && !isSelected ? 'Máximo de 3 categorias permitidas' : ''}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 truncate">{category.name}</h4>
                        <p className="text-sm text-gray-500 mt-1">
                          {category.slug && `Slug: ${category.slug}`}
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
            {selectedCategoryIds.length} de 3 categoria(s) selecionada(s). As categorias aparecerão na ordem selecionada.
          </p>
        </div>
      </div>
    </>
  );

  return typeof document !== 'undefined' 
    ? createPortal(modalContent, document.body)
    : null;
}

CategoryBanner.craft = {
  displayName: 'Category Banner',
  props: {
    categoryImages: [], // Array de URLs das imagens das categorias
    selectedCategoryIds: [], // IDs das categorias selecionadas
  },
  isCanvas: true,
  rules: {
    canMoveIn: () => false,
    canMoveOut: () => false,
  },
}
