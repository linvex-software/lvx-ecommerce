'use client'

import React, { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Settings, X, Search } from "lucide-react";
import { useSafeNode } from "../../lib/hooks/use-safe-node";
import { EditableText } from "../common/editable-text";
import { EditableImage } from "../common/editable-image";
import { useNode, Element } from '@craftjs/core';
import { useQuery } from '@tanstack/react-query';
import { createPortal } from 'react-dom';


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
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showColorModal, setShowColorModal] = useState(false);
  const [selectedCategoryForColor, setSelectedCategoryForColor] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [colorUpdateKey, setColorUpdateKey] = useState(0); // Para forçar re-render
  
  // Obter props do Craft.js PRIMEIRO
  let craftProps: { 
    categoryImages?: string[];
    selectedCategoryIds?: string[];
    categoryTitleColors?: Record<string, string>; // { categoryId: color }
  } = {};
  let nodeActions: { setProp: (callback: (props: any) => void) => void } | null = null;
  let hasCraftContext = false;
  
  try {
    const node = useNode((node) => ({
      categoryImages: node.data.props.categoryImages || [],
      selectedCategoryIds: node.data.props.selectedCategoryIds || [],
      categoryTitleColors: node.data.props.categoryTitleColors || {},
    }));
    const fullNode = useNode();
    craftProps = { 
      categoryImages: node.categoryImages,
      selectedCategoryIds: node.selectedCategoryIds,
      categoryTitleColors: node.categoryTitleColors,
    };
    nodeActions = fullNode.actions;
    hasCraftContext = true;
  } catch (e) {
    // Não está no contexto do editor - tentar obter props do layout salvo
    console.log('[CategoryBanner] Não está no contexto do Craft.js, tentando obter props do layout salvo');
    hasCraftContext = false;
  }
  
  // Debug: logar quando categoryTitleColors mudar
  React.useEffect(() => {
    if (hasCraftContext) {
      console.log('[CategoryBanner] categoryTitleColors atualizado:', craftProps.categoryTitleColors);
    }
  }, [craftProps.categoryTitleColors, hasCraftContext]);
  
  // Verificar se está no editor - usar múltiplas verificações para garantir
  const [isInEditorMode, setIsInEditorMode] = React.useState(false);
  
  React.useEffect(() => {
    setMounted(true);
  }, []);
  
  React.useEffect(() => {
    // Verificar se está no editor
    if (typeof window === 'undefined') {
      setIsInEditorMode(false) // SSR nunca está no editor
      return
    }
    
    const urlParams = new URLSearchParams(window.location.search)
    const isEditable = urlParams.get('editable') === 'true'
    const isInIframe = window.self !== window.top
    const pathname = window.location.pathname
    const isPreviewPage = pathname === '/preview'
    
    // Está no editor APENAS se TODAS as condições forem atendidas:
    // 1. Está na página /preview
    // 2. Tem editable=true na URL
    // 3. Está em iframe (dentro do editor)
    // 4. Tem contexto do Craft.js (hasCraftContext)
    // Isso garante que os botões NÃO apareçam na loja pública
    const shouldBeInEditor = isPreviewPage && isEditable && isInIframe && hasCraftContext
    
    setIsInEditorMode(shouldBeInEditor)
    
    console.log('[CategoryBanner] Verificação do editor:', {
      isPreviewPage,
      isEditable,
      isInIframe,
      hasCraftContext,
      shouldBeInEditor,
      pathname
    })
  }, [hasCraftContext])
  
  const setProp = nodeActions?.setProp || (() => {});
  
  const handleCategoryIdsChange = (ids: string[]) => {
    setProp((props: any) => {
      props.selectedCategoryIds = ids;
    });
  };

  const handleCategoryTitleColorChange = (categoryId: string, color: string) => {
    console.log('[CategoryBanner] Alterando cor da categoria:', { categoryId, color });
    setProp((props: any) => {
      const currentColors = props.categoryTitleColors || {};
      const newColors = {
        ...currentColors,
        [categoryId]: color
      };
      props.categoryTitleColors = newColors;
      console.log('[CategoryBanner] Novas cores:', newColors);
    });
    // Forçar re-render para atualizar a cor em tempo real
    setColorUpdateKey(prev => prev + 1);
  };

  const handleCategoryTitleDoubleClick = (categoryId: string, e: React.MouseEvent) => {
    if (isInEditorMode) {
      e.preventDefault();
      e.stopPropagation();
      setSelectedCategoryForColor(categoryId);
      setShowColorModal(true);
    }
  };

  // Obter cores atualizadas diretamente do useNode quando disponível
  const currentTitleColors = React.useMemo(() => {
    if (hasCraftContext) {
      return craftProps.categoryTitleColors || {};
    }
    return {};
  }, [hasCraftContext, craftProps.categoryTitleColors, colorUpdateKey]);

  const getCategoryTitleColor = React.useCallback((categoryId: string): string => {
    return currentTitleColors[categoryId] || '#FFFFFF';
  }, [currentTitleColors]);
  
  // Debug: verificar se está no editor
  useEffect(() => {
    console.log('[CategoryBanner] Estado do editor:', {
      isInEditor,
      hasCraftContext,
      isInEditorMode,
      mounted
    });
  }, [isInEditor, hasCraftContext, isInEditorMode, mounted]);

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

  // Função para lidar com mudança de imagem de categoria
  const handleCategoryImageChange = (categoryIndex: number, newUrl: string) => {
    console.log('[CategoryBanner] Mudando imagem da categoria', { categoryIndex, newUrl, hasCraftContext, isInEditor });
    setProp((props: any) => {
      const currentImages = props.categoryImages || [];
      const newImages = [...currentImages];
      newImages[categoryIndex] = newUrl;
      props.categoryImages = newImages;
      console.log('[CategoryBanner] Imagens atualizadas:', newImages);
    });
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
  const settingsModal = showSettingsModal && isInEditorMode && mounted ? (
    <CategoryBannerSettings
      selectedCategoryIds={craftProps.selectedCategoryIds || []}
      onCategoryIdsChange={handleCategoryIdsChange}
      onClose={() => setShowSettingsModal(false)}
      isOpen={showSettingsModal}
    />
  ) : null;

  // Renderizar modal de cor do título apenas no editor
  const colorModal = showColorModal && isInEditorMode && mounted && selectedCategoryForColor ? (
    <CategoryTitleColorModal
      categoryId={selectedCategoryForColor}
      categoryName={categories.find(c => c.id === selectedCategoryForColor)?.name || 'Categoria'}
      color={getCategoryTitleColor(selectedCategoryForColor)}
      onColorChange={(color) => handleCategoryTitleColorChange(selectedCategoryForColor, color)}
      onClose={() => {
        setShowColorModal(false);
        setSelectedCategoryForColor(null);
      }}
      isOpen={showColorModal}
    />
  ) : null;

  return (
    <>
      {settingsModal}
      {colorModal}
    <section ref={(ref: HTMLElement | null) => { if (ref) connect(ref) }} className="py-16 bg-cream relative">
      {/* Botão para abrir configurações - apenas no editor */}
      {isInEditorMode && mounted && (
        <button
          data-modal-button="true"
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('[CategoryBanner] Botão de configurações clicado');
            setShowSettingsModal(true);
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 hover:bg-white shadow-lg flex items-center justify-center transition-all z-[100] group/btn"
          title="Configurar categorias (máximo 3)"
          style={{ pointerEvents: 'auto', cursor: 'pointer' }}
        >
          <Settings 
            className="w-5 h-5 text-gray-700 group-hover/btn:text-primary transition-colors pointer-events-none" 
            style={{ pointerEvents: 'none' }}
          />
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
                <div className="relative w-full h-full">
                  {isInEditorMode ? (
                    // No editor, não usar Link para não bloquear edição
                    <div className="block w-full h-full relative">
                      <EditableImage
                        src={imageUrl}
                        alt={category.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        buttonPosition="top-right"
                        imageProp={`categoryImage_${index}`}
                        onImageChange={(url) => {
                          console.log('[CategoryBanner] Imagem alterada via EditableImage', { index, url });
                          handleCategoryImageChange(index, url);
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-charcoal/60 via-transparent to-transparent pointer-events-none" />
                    </div>
                  ) : (
                    // Fora do editor, usar Link normalmente
                    <Link
                      href={category.href}
                      className="block w-full h-full"
                    >
                      <EditableImage
                        src={imageUrl}
                        alt={category.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        buttonPosition="top-right"
                        imageProp={`categoryImage_${index}`}
                        onImageChange={(url) => {
                          console.log('[CategoryBanner] Imagem alterada via EditableImage', { index, url });
                          handleCategoryImageChange(index, url);
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-charcoal/60 via-transparent to-transparent pointer-events-none" />
                    </Link>
                  )}
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-6 text-center z-10">
                  <div 
                    className="font-display text-2xl mb-2 "
                    onDoubleClick={(e) => handleCategoryTitleDoubleClick(category.id, e)}
                    title={isInEditorMode ? "Duplo clique para alterar a cor" : undefined}
                    style={{
                      color: getCategoryTitleColor(category.id),
                      cursor: isInEditorMode ? 'pointer' : 'default',
                      userSelect: 'none',
                    }}
                  >
                    {category.name}
                  </div>
                  {isInEditorMode ? (
                    // No editor, renderizar sem link para não bloquear edição
                    renderEditableText(`${category.nodeId}_cta`, {
                      tag: "span",
                      className: "inline-block text-white/80 text-xs tracking-widest uppercase font-body border-b border-gold pb-1 group-hover:border-primary transition-colors",
                      content: "Ver Coleção"
                    })
                  ) : (
                    // Fora do editor, envolver em Link - remover borda do EditableText
                    <Link
                      href={category.href}
                      className="category-cta-link inline-block text-white/80 text-xs tracking-widest uppercase font-body  border-none pb-1 group-hover:border-primary transition-colors no-underline hover:no-underline"
                      style={{ textDecoration: 'none' }}
                    >
                      {renderEditableText(`${category.nodeId}_cta`, {
                        tag: "span",
                        className: "category-cta-text",
                        content: "Ver Coleção"
                      })}
                    </Link>
                  )}
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
        
        /* Remover borda do texto interno quando estiver dentro do Link */
        .category-cta-link .category-cta-text,
        .category-cta-link .category-cta-text * {
          border-bottom: none !important;
          border: none !important;
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

  // Fechar ao clicar fora do modal
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    // Adicionar listener após um pequeno delay para evitar fechar imediatamente ao abrir
    const timeout = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeout);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Fechar ao pressionar Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const modalContent = (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 z-[9998] bg-black/50"
        onClick={onClose}
      />
      {/* Modal */}
      <div
        ref={modalRef}
        data-modal="true"
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
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            {selectedCategoryIds.length} de 3 categoria(s) selecionada(s). As categorias aparecerão na ordem selecionada.
          </p>
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onClose();
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors font-medium"
            data-modal-button="true"
          >
            OK
          </button>
        </div>
      </div>
    </>
  );

  return typeof document !== 'undefined' 
    ? createPortal(modalContent, document.body)
    : null;
}

// Componente de Modal para configurar cor do título de uma categoria específica
function CategoryTitleColorModal({
  categoryId,
  categoryName,
  color,
  onColorChange,
  onClose,
  isOpen,
}: {
  categoryId: string;
  categoryName: string;
  color: string;
  onColorChange: (color: string) => void;
  onClose: () => void;
  isOpen: boolean;
}) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [currentColor, setCurrentColor] = useState(color);

  // Atualizar cor local quando a prop mudar
  useEffect(() => {
    setCurrentColor(color);
  }, [color]);

  // Fechar ao clicar fora do modal
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const timeout = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeout);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Fechar ao pressionar Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const handleColorChange = (newColor: string) => {
    setCurrentColor(newColor);
    onColorChange(newColor);
  };

  const modalContent = (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 z-[9998] bg-black/50"
        onClick={onClose}
      />
      {/* Modal */}
      <div
        ref={modalRef}
        data-modal="true"
        className="fixed z-[9999] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-lg shadow-2xl border-2 border-blue-500 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Cor do Título</h3>
            <p className="text-sm text-gray-500 mt-1">
              {categoryName}
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
            data-modal-button="true"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Color Picker */}
        <div className="p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Escolha a cor do título
          </label>
          <p className="text-xs text-gray-500 mb-4">
            A cor será aplicada ao nome da categoria "{categoryName}"
          </p>
          
          <div className="flex items-center gap-3">
            {/* Preview da cor atual */}
            <div className="relative">
              <button
                type="button"
                data-modal-button="true"
                className="h-16 w-16 rounded-xl border-2 border-gray-200 shadow-sm transition-all hover:scale-105 hover:shadow-md"
                style={{ backgroundColor: currentColor }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                {currentColor === '#FFFFFF' && (
                  <div className="absolute inset-0 rounded-xl border border-gray-300" />
                )}
              </button>
              
              {/* Color picker nativo */}
              <input
                type="color"
                value={currentColor}
                onChange={(e) => {
                  e.stopPropagation();
                  handleColorChange(e.target.value);
                }}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                data-modal-button="true"
              />
            </div>

            {/* Input de texto para código hex */}
            <div className="flex-1">
              <input
                type="text"
                value={currentColor}
                onChange={(e) => {
                  const newColor = e.target.value;
                  if (/^#[0-9A-F]{6}$/i.test(newColor) || newColor === '') {
                    handleColorChange(newColor || '#FFFFFF');
                  }
                }}
                placeholder="#FFFFFF"
                className="h-16 w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-mono ring-offset-white placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2"
                data-modal-button="true"
              />
            </div>
          </div>

          {/* Preview do título com a cor */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-2">Preview:</p>
            <h3 
              className="font-display text-2xl"
              style={{ color: currentColor }}
            >
              {categoryName}
            </h3>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onClose();
            }}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors font-medium"
            data-modal-button="true"
          >
            Cancelar
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onClose();
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors font-medium"
            data-modal-button="true"
          >
            Salvar
          </button>
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
    categoryTitleColors: {}, // Objeto com cores por categoria: { [categoryId]: color }
  },
  isCanvas: true,
  rules: {
    canMoveIn: () => false,
    canMoveOut: () => false,
  },
}
