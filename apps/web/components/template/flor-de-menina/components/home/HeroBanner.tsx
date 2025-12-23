'use client'

import React, { useState, createContext, useContext, useEffect, useCallback, useRef } from 'react';
import { useSafeNode } from "../../lib/hooks/use-safe-node";
import { useNode, Element, useEditor } from '@craftjs/core';
import { Header } from "../layout/Header";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "../ui/carousel";
import { X, ArrowUp, ArrowDown, ImagePlus, Loader2 } from "lucide-react";
import { useImageUpload } from '@/lib/hooks/use-image-upload';
import { createPortal } from 'react-dom';
import Link from 'next/link';

// Contexto para indicar que o Header está dentro de um HeroBanner
const HeroBannerContext = createContext<boolean>(false);
export const useHeroBannerContext = () => useContext(HeroBannerContext);

// Flag global para indicar se há um Header dentro de um HeroBanner
let hasHeaderInHero = false;
export const setHeaderInHero = (value: boolean) => {
  hasHeaderInHero = value;
};
export const getHeaderInHero = () => hasHeaderInHero;

export function HeroBanner() {
  const safeNode = useSafeNode();
  const { connectors } = safeNode;
  const { connect } = connectors;
  const isInEditor = 'isInEditor' in safeNode ? safeNode.isInEditor : false;
  
  // Verificar se está no editor através da URL (mesma lógica do EditableImage)
  const [isInEditorMode, setIsInEditorMode] = React.useState(false);
  
  React.useEffect(() => {
    if (typeof window === 'undefined') {
      setIsInEditorMode(false);
      return;
    }
    
    const urlParams = new URLSearchParams(window.location.search);
    const isEditable = urlParams.get('editable') === 'true';
    const isInIframe = window.self !== window.top;
    const pathname = window.location.pathname;
    const isPreviewPage = pathname === '/preview';
    
    // Está no editor APENAS se TODAS as condições forem atendidas:
    // 1. Está na página /preview
    // 2. Tem editable=true na URL
    // 3. Está em iframe (dentro do editor)
    // 4. Tem contexto do Craft.js (isInEditor)
    const shouldBeInEditor = isPreviewPage && isEditable && isInIframe && isInEditor;
    
    setIsInEditorMode(shouldBeInEditor);
  }, [isInEditor]);
  
  // Tipo para imagens com link
  type HeroImage = {
    imageUrl: string;
    link: string;
  };
  
  // Obter props do Craft.js para as imagens de fundo
  let craftProps: { 
    backgroundImages?: (string | HeroImage)[];
    backgroundImagesMobile?: (string | HeroImage)[];
    backgroundImage?: string; // Mantido para compatibilidade
    showCarouselControls?: boolean;
    autoPlayInterval?: number;
  } = {};
  let nodeActions: { setProp: (callback: (props: any) => void) => void } | null = null;
  
  try {
    const node = useNode((node: any) => ({
      backgroundImages: node.data.props.backgroundImages || [],
      backgroundImagesMobile: node.data.props.backgroundImagesMobile || [],
      backgroundImage: node.data.props.backgroundImage || '',
      showCarouselControls: node.data.props.showCarouselControls !== undefined ? node.data.props.showCarouselControls : true,
      autoPlayInterval: node.data.props.autoPlayInterval || 3000,
    }));
    const fullNode = useNode();
    craftProps = {
      backgroundImages: node.backgroundImages,
      backgroundImagesMobile: node.backgroundImagesMobile,
      backgroundImage: node.backgroundImage,
      showCarouselControls: node.showCarouselControls,
      autoPlayInterval: node.autoPlayInterval,
    };
    nodeActions = fullNode.actions;
  } catch (e) {
    // Não está no contexto do editor
  }
  

  // Obter array de imagens de fundo (do Craft.js ou padrão)
  // Compatibilidade: suporta tanto strings quanto objetos { imageUrl, link }
  const defaultBackgroundImage = "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1920&h=1080&fit=crop";
  
  // Normalizar imagem: converte string para objeto { imageUrl, link }
  const normalizeImage = (img: string | HeroImage): HeroImage => {
    if (typeof img === 'string') {
      return { imageUrl: img, link: '' };
    }
    return img;
  };
  
  const getBackgroundImages = (): HeroImage[] => {
    // Se backgroundImages existir e não estiver vazio, usar
    if (craftProps.backgroundImages && craftProps.backgroundImages.length > 0) {
      return craftProps.backgroundImages.map(normalizeImage);
    }
    // Se backgroundImage existir (compatibilidade com versão antiga), converter para array
    if (craftProps.backgroundImage) {
      return [{ imageUrl: craftProps.backgroundImage, link: '' }];
    }
    // Fallback para imagem padrão
    return [{ imageUrl: defaultBackgroundImage, link: '' }];
  };
  
  const getBackgroundImagesMobile = (): HeroImage[] => {
    // Se backgroundImagesMobile existir e não estiver vazio, usar
    if (craftProps.backgroundImagesMobile && craftProps.backgroundImagesMobile.length > 0) {
      return craftProps.backgroundImagesMobile.map(normalizeImage);
    }
    // Se não houver imagens mobile, usar as imagens desktop como fallback
    return getBackgroundImages();
  };
  
  const backgroundImages = getBackgroundImages();
  const backgroundImagesMobile = getBackgroundImagesMobile();
  const showCarouselControls = craftProps.showCarouselControls !== false; // Default true
  const autoPlayInterval = craftProps.autoPlayInterval || 3000;
  
  // Estado para controlar o carousel desktop
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  
  // Estado para controlar o carousel mobile
  const [apiMobile, setApiMobile] = useState<CarouselApi>();
  const [currentMobile, setCurrentMobile] = useState(0);
  
  // Auto-play do carousel desktop (apenas quando há mais de uma imagem)
  useEffect(() => {
    if (!api || backgroundImages.length <= 1) return;
    
    const interval = setInterval(() => {
      if (api.canScrollNext()) {
        api.scrollNext();
      } else {
        // Voltar ao início quando chegar ao fim
        api.scrollTo(0);
      }
    }, autoPlayInterval);
    
    return () => clearInterval(interval);
  }, [api, autoPlayInterval, backgroundImages.length]);
  
  // Auto-play do carousel mobile (apenas quando há mais de uma imagem)
  useEffect(() => {
    if (!apiMobile || backgroundImagesMobile.length <= 1) return;
    
    const interval = setInterval(() => {
      if (apiMobile.canScrollNext()) {
        apiMobile.scrollNext();
      } else {
        // Voltar ao início quando chegar ao fim
        apiMobile.scrollTo(0);
      }
    }, autoPlayInterval);
    
    return () => clearInterval(interval);
  }, [apiMobile, autoPlayInterval, backgroundImagesMobile.length]);
  
  // Atualizar índice atual quando o carousel desktop mudar
  useEffect(() => {
    if (!api) return;
    
    const onSelect = () => {
      setCurrent(api.selectedScrollSnap());
    };
    
    api.on('select', onSelect);
    onSelect(); // Chamar imediatamente para definir o índice inicial
    
    return () => {
      api.off('select', onSelect);
    };
  }, [api]);
  
  // Atualizar índice atual quando o carousel mobile mudar
  useEffect(() => {
    if (!apiMobile) return;
    
    const onSelect = () => {
      setCurrentMobile(apiMobile.selectedScrollSnap());
    };
    
    apiMobile.on('select', onSelect);
    onSelect(); // Chamar imediatamente para definir o índice inicial
    
    return () => {
      apiMobile.off('select', onSelect);
    };
  }, [apiMobile]);
  
  // Migração automática: converter backgroundImage antigo para backgroundImages
  useEffect(() => {
    if (!nodeActions || !isInEditor) return;
    
    // Se tem backgroundImage mas não tem backgroundImages (ou está vazio), migrar
    if (craftProps.backgroundImage && (!craftProps.backgroundImages || craftProps.backgroundImages.length === 0)) {
      nodeActions.setProp((props: any) => {
        // Migrar backgroundImage para backgroundImages como objeto
        props.backgroundImages = [{ imageUrl: craftProps.backgroundImage, link: '' }];
        // Limpar backgroundImage antigo (opcional, mas mantém compatibilidade)
        // props.backgroundImage = '';
      });
    }
    
    // Migrar arrays de strings para objetos (compatibilidade)
    if (craftProps.backgroundImages && craftProps.backgroundImages.length > 0) {
      const needsMigration = (craftProps.backgroundImages || []).some((img: any) => typeof img === 'string');
      if (needsMigration) {
        nodeActions.setProp((props: any) => {
          props.backgroundImages = (craftProps.backgroundImages || []).map((img: any) => 
            typeof img === 'string' ? { imageUrl: img, link: '' } : img
          );
        });
      }
    }
    
    if (craftProps.backgroundImagesMobile && craftProps.backgroundImagesMobile.length > 0) {
      const needsMigration = (craftProps.backgroundImagesMobile || []).some((img: any) => typeof img === 'string');
      if (needsMigration) {
        nodeActions.setProp((props: any) => {
          props.backgroundImagesMobile = (craftProps.backgroundImagesMobile || []).map((img: any) => 
            typeof img === 'string' ? { imageUrl: img, link: '' } : img
          );
        });
      }
    }
  }, [nodeActions, isInEditor, craftProps.backgroundImage, craftProps.backgroundImages, craftProps.backgroundImagesMobile]);

  // Marcar que há um Header dentro deste HeroBanner
  React.useEffect(() => {
    setHeaderInHero(true);
    return () => {
      setHeaderInHero(false);
    };
  }, []);

  // Estado para controlar se o componente está montado
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Estado para controlar abertura do modal (mesma lógica do ProductShowcase)
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Renderizar modal de configurações apenas no editor
  const settingsModal = showSettingsModal && isInEditorMode && mounted ? (
    <HeroBannerSettings
      onClose={() => setShowSettingsModal(false)}
      isOpen={showSettingsModal}
    />
  ) : null;

  return (
    <>
      {settingsModal}
    <HeroBannerContext.Provider value={true}>
      <section 
        ref={(ref: HTMLElement | null) => { if (ref) connect(ref) }} 
          className="relative h-screen overflow-hidden"
        style={{ zIndex: 0 }}
      >
          {/* Background Images Carousel - compartilhado com o header */}
        <div className="absolute inset-0">
            {/* Carousel Desktop - oculto em mobile */}
            <div className="hidden md:block w-full h-full">
              <Carousel
                setApi={setApi}
                opts={{
                  align: "start",
                  loop: backgroundImages.length > 1,
                }}
                className="w-full h-full"
              >
                <CarouselContent className="h-full -ml-0">
                  {backgroundImages.map((image, index) => (
                    <CarouselItem key={index} className="h-full pl-0 basis-full">
                      <div className="relative w-full h-[100vh]">
                        {image.link ? (
                          <Link href={image.link} className="block w-full h-full">
                            <img
                              src={image.imageUrl}
                              alt={`Hero Banner Desktop ${index + 1}`}
                              className="w-full h-full object-cover cursor-pointer"
                            />
                          </Link>
                        ) : (
                          <img
                            src={image.imageUrl}
                            alt={`Hero Banner Desktop ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                {/* Indicadores de slide - apenas quando há mais de uma imagem */}
                {showCarouselControls && backgroundImages.length > 1 && (
                  <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                    {backgroundImages.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => api?.scrollTo(index)}
                        className={`h-2 rounded-full transition-all duration-300 ${
                          current === index
                            ? 'w-8 bg-white'
                            : 'w-2 bg-white/50 hover:bg-white/75'
                        }`}
                        aria-label={`Ir para slide ${index + 1}`}
                      />
                    ))}
        </div>
                )}
              </Carousel>
          </div>
            
            {/* Carousel Mobile - visível apenas em mobile */}
            <div className="block md:hidden w-full h-full">
              <Carousel
                setApi={setApiMobile}
                opts={{
                  align: "start",
                  loop: backgroundImagesMobile.length > 1,
                }}
                className="w-full h-full"
              >
                <CarouselContent className="h-full -ml-0">
                  {backgroundImagesMobile.map((image, index) => (
                    <CarouselItem key={index} className="h-full pl-0 basis-full">
                      <div className="relative w-full h-[100vh]">
                        {image.link ? (
                          <Link href={image.link} className="block w-full h-full">
                            <img
                              src={image.imageUrl}
                              alt={`Hero Banner Mobile ${index + 1}`}
                              className="w-full h-full object-cover cursor-pointer"
                            />
                          </Link>
                        ) : (
                          <img
                            src={image.imageUrl}
                            alt={`Hero Banner Mobile ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                {/* Indicadores de slide - apenas quando há mais de uma imagem */}
                {showCarouselControls && backgroundImagesMobile.length > 1 && (
                  <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                    {backgroundImagesMobile.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => apiMobile?.scrollTo(index)}
                        className={`h-2 rounded-full transition-all duration-300 ${
                          currentMobile === index
                            ? 'w-8 bg-white'
                            : 'w-2 bg-white/50 hover:bg-white/75'
                        }`}
                        aria-label={`Ir para slide ${index + 1}`}
                      />
                    ))}
                  </div>
                )}
              </Carousel>
            </div>
      </div>

          {/* Header integrado dentro da Hero Section */}
          <div className="absolute top-0 left-0 right-0 z-50">
            <Header />
      </div>

          {/* Botão para abrir configurações - apenas no editor (mesma lógica do ProductShowcase) */}
          {isInEditorMode && mounted && (
            <button
              data-modal-button="true"
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('[HeroBanner] Botão de configurações clicado');
                setShowSettingsModal(true);
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 hover:bg-white shadow-lg flex items-center justify-center transition-all z-[100] group/btn"
              title="Gerenciar imagens do carousel"
              style={{ pointerEvents: 'auto', cursor: 'pointer' }}
            >
              <ImagePlus 
                className="w-5 h-5 text-gray-700 group-hover/btn:text-primary transition-colors pointer-events-none" 
                style={{ pointerEvents: 'none' }}
              />
            </button>
          )}

      </section>
    </HeroBannerContext.Provider>
    </>
  );
}

// Componente de Settings para editar imagens e botões CTA (mesma lógica do ProductShowcase)
function HeroBannerSettings({
  onClose,
  isOpen,
}: {
  onClose: () => void;
  isOpen: boolean;
}) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const fileInputMobileRef = React.useRef<HTMLInputElement>(null);
  const modalRef = React.useRef<HTMLDivElement>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  
  // Função customizada de upload que obtém token do parent window quando em iframe
  const uploadImage = React.useCallback(async (file: File): Promise<string> => {
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      // Tentar obter token do parent window (admin) se estiver em iframe
      let accessToken: string | null = null;
      
      if (typeof window !== 'undefined' && window.self !== window.top) {
        // Está em iframe - tentar obter token do parent via postMessage
        try {
          const tokenPromise = new Promise<string | null>((resolve) => {
            const timeout = setTimeout(() => {
              window.removeEventListener('message', handleMessage);
              resolve(null);
            }, 2000);
            
            const handleMessage = (event: MessageEvent) => {
              if (event.data?.type === 'GET_AUTH_TOKEN_RESPONSE' && event.data?.token) {
                clearTimeout(timeout);
                window.removeEventListener('message', handleMessage);
                console.log('[HeroBannerSettings] Token recebido do parent');
                resolve(event.data.token);
              }
            };
            
            window.addEventListener('message', handleMessage);
            window.parent.postMessage({ type: 'GET_AUTH_TOKEN' }, '*');
            console.log('[HeroBannerSettings] Solicitando token do parent window');
          });
          
          accessToken = await tokenPromise;
        } catch (e) {
          console.warn('[HeroBannerSettings] Erro ao obter token do parent:', e);
        }
      }
      
      // Fallback: tentar obter do localStorage local
      if (!accessToken && typeof window !== 'undefined') {
        try {
          const authStorage = localStorage.getItem('auth-storage');
          if (authStorage) {
            const parsed = JSON.parse(authStorage);
            accessToken = parsed?.state?.accessToken || null;
            if (accessToken) {
              console.log('[HeroBannerSettings] Token obtido do localStorage local');
            }
          }
        } catch (e) {
          // Ignorar erro
        }
      }
      
      if (!accessToken) {
        throw new Error('Token de autenticação não encontrado. Por favor, faça login novamente.');
      }
      
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
      const headers: Record<string, string> = {};
      
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }
      
      const storeId = process.env.NEXT_PUBLIC_STORE_ID;
      if (storeId) {
        headers['x-store-id'] = storeId;
      }
      
      const response = await fetch(`${API_URL}/admin/upload/image`, {
        method: 'POST',
        headers,
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) {
        let errorMessage = 'Erro ao fazer upload da imagem';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      
      if (data.success && data.url) {
        return data.url;
      }
      
      throw new Error('Resposta inválida do servidor');
    } catch (error: any) {
      console.error('[HeroBannerSettings] Erro ao fazer upload:', error);
      throw error;
    } finally {
      setIsUploading(false);
    }
  }, []);
  
  type HeroImage = {
    imageUrl: string;
    link: string;
  };
  
  let nodeData: {
    actions: { setProp: (callback: (props: any) => void) => void }
    props: {
      backgroundImages?: (string | HeroImage)[]
      backgroundImagesMobile?: (string | HeroImage)[]
      backgroundImage?: string
      cta1Text?: string
      cta1Link?: string
      cta1BackgroundColor?: string
      cta1TextColor?: string
      cta2Text?: string
      cta2Link?: string
      cta2BackgroundColor?: string
      cta2TextColor?: string
      showCarouselControls?: boolean
      autoPlayInterval?: number
    }
  } | null = null

  try {
    const node = useNode((node: any) => ({
      backgroundImages: node.data.props.backgroundImages || [],
      backgroundImagesMobile: node.data.props.backgroundImagesMobile || [],
      backgroundImage: node.data.props.backgroundImage || '',
      cta1Text: node.data.props.cta1Text || 'Ver Coleção',
      cta1Link: node.data.props.cta1Link || '/produtos?filter=featured',
      cta1BackgroundColor: node.data.props.cta1BackgroundColor || '',
      cta1TextColor: node.data.props.cta1TextColor || '',
      cta2Text: node.data.props.cta2Text || 'Explorar Tudo',
      cta2Link: node.data.props.cta2Link || '/produtos',
      cta2BackgroundColor: node.data.props.cta2BackgroundColor || '',
      cta2TextColor: node.data.props.cta2TextColor || '',
      showCarouselControls: node.data.props.showCarouselControls !== undefined ? node.data.props.showCarouselControls : true,
      autoPlayInterval: node.data.props.autoPlayInterval || 3000,
    }))
    const fullNode = useNode();
    nodeData = {
      actions: fullNode.actions,
      props: {
        backgroundImages: node.backgroundImages,
        backgroundImagesMobile: node.backgroundImagesMobile,
        backgroundImage: node.backgroundImage,
        cta1Text: node.cta1Text,
        cta1Link: node.cta1Link,
        cta1BackgroundColor: node.cta1BackgroundColor,
        cta1TextColor: node.cta1TextColor,
        cta2Text: node.cta2Text,
        cta2Link: node.cta2Link,
        cta2BackgroundColor: node.cta2BackgroundColor,
        cta2TextColor: node.cta2TextColor,
        showCarouselControls: node.showCarouselControls,
        autoPlayInterval: node.autoPlayInterval,
      },
    }
    console.log('[HeroBannerSettings] NodeData obtido:', { 
      hasSetProp: !!nodeData.actions.setProp,
      backgroundImagesCount: nodeData.props.backgroundImages?.length || 0,
      backgroundImagesMobileCount: nodeData.props.backgroundImagesMobile?.length || 0,
      backgroundImagesMobile: nodeData.props.backgroundImagesMobile,
      rawNode: node
    });
  } catch (e) {
    console.error('[HeroBannerSettings] Erro ao obter node:', e);
    return null
  }

  if (!nodeData || !nodeData.actions || !nodeData.actions.setProp) {
    console.error('[HeroBannerSettings] setProp não está disponível!', { nodeData });
    return null;
  }

  const { actions: { setProp }, props } = nodeData

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
  
  // Normalizar imagem: converte string para objeto { imageUrl, link }
  const normalizeImage = (img: string | HeroImage): HeroImage => {
    if (typeof img === 'string') {
      return { imageUrl: img, link: '' };
    }
    return img;
  };
  
  // Obter array de imagens (compatibilidade com backgroundImage antigo)
  // Usar useNode diretamente para garantir que seja atualizado quando as props mudarem
  const backgroundImages = React.useMemo(() => {
    const currentImages = props.backgroundImages || [];
    if (currentImages.length > 0) {
      return currentImages.map(normalizeImage);
    }
    if (props.backgroundImage) {
      return [{ imageUrl: props.backgroundImage, link: '' }];
    }
    return [];
  }, [props.backgroundImages, props.backgroundImage]);
  
  // Obter array de imagens mobile
  const backgroundImagesMobile = React.useMemo(() => {
    const currentImages = props.backgroundImagesMobile || [];
    console.log('[HeroBannerSettings] Normalizando imagens mobile:', { 
      raw: currentImages, 
      length: currentImages.length,
      type: typeof currentImages[0]
    });
    const normalized = currentImages.map(normalizeImage);
    console.log('[HeroBannerSettings] Imagens mobile normalizadas:', normalized);
    return normalized;
  }, [props.backgroundImagesMobile]);
  
  // Debug: log quando backgroundImagesMobile mudar
  React.useEffect(() => {
    console.log('[HeroBannerSettings] backgroundImagesMobile atualizado:', { 
      count: backgroundImagesMobile.length, 
      images: backgroundImagesMobile,
      propsImages: props.backgroundImagesMobile
    });
  }, [backgroundImagesMobile, props.backgroundImagesMobile]);
  
  // Debug: log quando backgroundImages mudar
  React.useEffect(() => {
    console.log('[HeroBannerSettings] backgroundImages atualizado:', { 
      count: backgroundImages.length, 
      images: backgroundImages,
      propsImages: props.backgroundImages
    });
  }, [backgroundImages, props.backgroundImages]);
  
  // Função para adicionar imagem
  const handleAddImage = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione apenas arquivos de imagem (JPG, PNG, GIF).');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 5MB. Por favor, escolha uma imagem menor.');
      return;
    }
    
    try {
      const uploadedUrl = await uploadImage(file);
      setProp((props: any) => {
        const currentImages = props.backgroundImages || [];
        // Normalizar imagens existentes e adicionar nova como objeto
        const normalizedImages = currentImages.map(normalizeImage);
        props.backgroundImages = [...normalizedImages, { imageUrl: uploadedUrl, link: '' }];
      });
    } catch (error: any) {
      alert(error.message || 'Erro ao fazer upload da imagem. Tente novamente.');
    }
  };
  
  // Função para remover imagem
  const handleRemoveImage = React.useCallback((index: number) => {
    console.log('[HeroBannerSettings] handleRemoveImage chamado', { index, hasSetProp: !!setProp });
    
    if (!setProp || typeof setProp !== 'function') {
      console.error('[HeroBannerSettings] setProp não está disponível!', { setProp, type: typeof setProp });
      alert('Erro: não foi possível remover a imagem. Por favor, recarregue a página.');
      return;
    }
    
    try {
      // Obter o array atual DENTRO do setProp callback (igual ao handleMoveImage)
      setProp((props: any) => {
        const currentImages = props.backgroundImages || [];
        const normalizedImages = currentImages.map(normalizeImage);
        console.log('[HeroBannerSettings] Removendo imagem dentro do setProp', { index, currentLength: normalizedImages.length, currentImages });
        
        if (normalizedImages.length > index) {
          // Criar novo array sem o item removido
          const newImages = normalizedImages.filter((_: HeroImage, i: number) => i !== index);
          console.log('[HeroBannerSettings] Novo array após remoção', { newLength: newImages.length, newImages });
          props.backgroundImages = newImages;
        } else {
          console.warn('[HeroBannerSettings] Índice inválido para remoção', { index, length: normalizedImages.length });
        }
      });
      console.log('[HeroBannerSettings] setProp chamado com sucesso');
    } catch (error) {
      console.error('[HeroBannerSettings] Erro ao remover imagem:', error);
      alert('Erro ao remover imagem. Por favor, tente novamente.');
    }
  }, [setProp]);
  
  // Função para reordenar imagens
  const handleMoveImage = React.useCallback((index: number, direction: 'up' | 'down') => {
    console.log('[HeroBannerSettings] handleMoveImage chamado', { index, direction, currentImages: props.backgroundImages, hasSetProp: !!setProp });
    
    if (!setProp || typeof setProp !== 'function') {
      console.error('[HeroBannerSettings] setProp não está disponível!', { setProp, type: typeof setProp });
      alert('Erro: não foi possível reordenar a imagem. Por favor, recarregue a página.');
      return;
    }
    
    try {
      // Obter o array atual diretamente das props dentro do setProp
      setProp((props: any) => {
        const currentImages = props.backgroundImages || [];
        const normalizedImages = currentImages.map(normalizeImage);
        
        if (normalizedImages.length <= 1) {
          console.log('[HeroBannerSettings] Não é possível reordenar: apenas 1 imagem');
          return;
        }
        
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= normalizedImages.length) {
          console.log('[HeroBannerSettings] Índice inválido para reordenação', { newIndex, length: normalizedImages.length });
          return;
        }
        
        // Criar novo array com os itens trocados
        const newImages = [...normalizedImages];
        [newImages[index], newImages[newIndex]] = [newImages[newIndex], newImages[index]];
        console.log('[HeroBannerSettings] Imagens reordenadas', { from: index, to: newIndex, newImages });
        props.backgroundImages = newImages;
      });
      console.log('[HeroBannerSettings] setProp chamado com sucesso para reordenação');
    } catch (error) {
      console.error('[HeroBannerSettings] Erro ao reordenar imagem:', error);
      alert('Erro ao reordenar imagem. Por favor, tente novamente.');
    }
  }, [setProp]);
  
  // Função para atualizar link de imagem
  const handleUpdateImageLink = (index: number, link: string) => {
    setProp((props: any) => {
      const currentImages = props.backgroundImages || [];
      const normalizedImages = currentImages.map(normalizeImage);
      if (normalizedImages[index] !== undefined) {
        // Criar novo array com o link atualizado
        const newImages = [...normalizedImages];
        newImages[index] = { ...newImages[index], link };
        props.backgroundImages = newImages;
      }
    });
  };
  
  // Funções para gerenciar imagens mobile
  const handleAddImageMobile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione apenas arquivos de imagem (JPG, PNG, GIF).');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 5MB. Por favor, escolha uma imagem menor.');
      return;
    }
    
    try {
      const uploadedUrl = await uploadImage(file);
      setProp((props: any) => {
        const currentImages = props.backgroundImagesMobile || [];
        // Normalizar imagens existentes e adicionar nova como objeto
        const normalizedImages = currentImages.map(normalizeImage);
        props.backgroundImagesMobile = [...normalizedImages, { imageUrl: uploadedUrl, link: '' }];
      });
    } catch (error: any) {
      alert(error.message || 'Erro ao fazer upload da imagem. Tente novamente.');
    }
  };
  
  // Função para remover imagem mobile
  const handleRemoveImageMobile = React.useCallback((index: number) => {
    console.log('[HeroBannerSettings] handleRemoveImageMobile chamado', { index, hasSetProp: !!setProp });
    
    if (!setProp || typeof setProp !== 'function') {
      console.error('[HeroBannerSettings] setProp não está disponível!', { setProp, type: typeof setProp });
      alert('Erro: não foi possível remover a imagem. Por favor, recarregue a página.');
      return;
    }
    
    try {
      setProp((props: any) => {
        const currentImages = props.backgroundImagesMobile || [];
        const normalizedImages = currentImages.map(normalizeImage);
        console.log('[HeroBannerSettings] Removendo imagem mobile dentro do setProp', { index, currentLength: normalizedImages.length, currentImages });
        
        if (normalizedImages.length > index) {
          // Criar novo array sem o item removido
          const newImages = normalizedImages.filter((_: HeroImage, i: number) => i !== index);
          console.log('[HeroBannerSettings] Novo array mobile após remoção', { newLength: newImages.length, newImages });
          props.backgroundImagesMobile = newImages;
        } else {
          console.warn('[HeroBannerSettings] Índice inválido para remoção mobile', { index, length: normalizedImages.length });
        }
      });
      console.log('[HeroBannerSettings] setProp chamado com sucesso para remoção mobile');
    } catch (error) {
      console.error('[HeroBannerSettings] Erro ao remover imagem mobile:', error);
      alert('Erro ao remover imagem. Por favor, tente novamente.');
    }
  }, [setProp]);
  
  // Função para reordenar imagens mobile
  const handleMoveImageMobile = React.useCallback((index: number, direction: 'up' | 'down') => {
    console.log('[HeroBannerSettings] handleMoveImageMobile chamado', { index, direction, currentImages: props.backgroundImagesMobile, hasSetProp: !!setProp });
    
    if (!setProp || typeof setProp !== 'function') {
      console.error('[HeroBannerSettings] setProp não está disponível!', { setProp, type: typeof setProp });
      alert('Erro: não foi possível reordenar a imagem. Por favor, recarregue a página.');
      return;
    }
    
    try {
      setProp((props: any) => {
        const currentImages = props.backgroundImagesMobile || [];
        const normalizedImages = currentImages.map(normalizeImage);
        
        if (normalizedImages.length <= 1) {
          console.log('[HeroBannerSettings] Não é possível reordenar mobile: apenas 1 imagem');
          return;
        }
        
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= normalizedImages.length) {
          console.log('[HeroBannerSettings] Índice inválido para reordenação mobile', { newIndex, length: normalizedImages.length });
          return;
        }
        
        // Criar novo array com os itens trocados
        const newImages = [...normalizedImages];
        [newImages[index], newImages[newIndex]] = [newImages[newIndex], newImages[index]];
        console.log('[HeroBannerSettings] Imagens mobile reordenadas', { from: index, to: newIndex, newImages });
        props.backgroundImagesMobile = newImages;
      });
      console.log('[HeroBannerSettings] setProp chamado com sucesso para reordenação mobile');
    } catch (error) {
      console.error('[HeroBannerSettings] Erro ao reordenar imagem mobile:', error);
      alert('Erro ao reordenar imagem. Por favor, tente novamente.');
    }
  }, [setProp, props.backgroundImagesMobile]);
  
  // Função para atualizar link de imagem mobile
  const handleUpdateImageLinkMobile = (index: number, link: string) => {
    setProp((props: any) => {
      const currentImages = props.backgroundImagesMobile || [];
      const normalizedImages = currentImages.map(normalizeImage);
      if (normalizedImages[index] !== undefined) {
        // Criar novo array com o link atualizado
        const newImages = [...normalizedImages];
        newImages[index] = { ...newImages[index], link };
        props.backgroundImagesMobile = newImages;
      }
    });
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
        className="fixed z-[9999] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl max-h-[90vh] bg-white rounded-lg shadow-2xl border-2 border-blue-500 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => {
          // Não bloquear eventos de botões dentro do modal
          const target = e.target as HTMLElement;
          if (target.closest('button')) {
            return; // Permitir que o evento continue para o botão
          }
          e.stopPropagation();
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
      <div>
            <h3 className="text-lg font-semibold text-gray-900">Configurar Hero Banner</h3>
            <p className="text-sm text-gray-500 mt-1">
              Gerencie as imagens do carousel
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Seção de Imagens do Carousel Desktop */}
          <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Imagens do Hero (Desktop)</h3>
        <p className="text-xs text-gray-600 mb-3">
          {backgroundImages.length === 0 
            ? 'Adicione imagens para criar o hero banner. Você pode adicionar múltiplas imagens para criar um carousel automático.'
            : backgroundImages.length === 1
            ? 'Você tem 1 imagem. Adicione mais imagens para criar um carousel automático que troca a cada 3 segundos.'
            : `Você tem ${backgroundImages.length} imagens. O carousel troca automaticamente a cada 3 segundos.`
          }
        </p>
        
        {/* Lista de imagens */}
        <div className="space-y-3 mb-3">
          {backgroundImages.length === 0 ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <ImagePlus className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-2">Nenhuma imagem adicionada</p>
              <p className="text-xs text-gray-500">Clique em "Adicionar Imagem" abaixo para começar</p>
            </div>
          ) : (
            backgroundImages.map((image, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-3">
              <div className="flex items-start gap-3">
                <div className="relative w-20 h-20 flex-shrink-0 rounded overflow-hidden bg-gray-100">
                  <img
                    src={image.imageUrl}
                    alt={`Hero image ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-700">
                      Imagem {index + 1}
                    </span>
                    <div 
                      className="flex gap-1" 
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      <button
                        type="button"
                        data-modal-button="true"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('[HeroBannerSettings] Botão mover para cima clicado', { index });
                          handleMoveImage(index, 'up');
                        }}
                        disabled={index === 0}
                        className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Mover para cima"
                        style={{ pointerEvents: 'auto', zIndex: 10 }}
                      >
                        <ArrowUp className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        data-modal-button="true"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('[HeroBannerSettings] Botão mover para baixo clicado', { index });
                          handleMoveImage(index, 'down');
                        }}
                        disabled={index === backgroundImages.length - 1}
                        className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Mover para baixo"
                        style={{ pointerEvents: 'auto', zIndex: 10 }}
                      >
                        <ArrowDown className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        data-modal-button="true"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('[HeroBannerSettings] Botão remover clicado', { index });
                          handleRemoveImage(index);
                        }}
                        className="p-1 text-red-500 hover:text-red-700 transition-colors"
                        title="Remover imagem"
                        style={{ pointerEvents: 'auto', zIndex: 10 }}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={image.link}
                    onChange={(e) => handleUpdateImageLink(index, e.target.value)}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Link de redirecionamento (ex: /produtos, https://exemplo.com)"
                  />
                </div>
              </div>
            </div>
            ))
          )}
        </div>
        
        {/* Botão para adicionar imagem */}
          <div>
            <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            id="hero-banner-image-input"
            className="hidden"
            onChange={(e) => {
              console.log('[HeroBannerSettings] Input file onChange disparado', e.target.files);
              const file = e.target.files?.[0];
              if (file) {
                console.log('[HeroBannerSettings] Arquivo selecionado:', file.name, file.type, file.size);
                handleAddImage(file);
              }
              // Resetar input para permitir selecionar o mesmo arquivo novamente
              if (fileInputRef.current) {
                fileInputRef.current.value = '';
              }
            }}
          />
          <label
            htmlFor="hero-banner-image-input"
            className={`w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 flex items-center justify-center gap-2 cursor-pointer transition-colors ${
              isUploading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            style={{ pointerEvents: isUploading ? 'none' : 'auto' }}
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Fazendo upload...
              </>
            ) : (
              <>
                <ImagePlus className="h-4 w-4" />
                Adicionar Imagem
              </>
            )}
          </label>
          </div>
        
        {/* Configurações do carousel */}
        {backgroundImages.length > 1 && (
          <div className="mt-4 p-3 border border-gray-200 rounded-lg space-y-3">
            <h4 className="text-xs font-medium text-gray-700 uppercase tracking-wide">Configurações do Carousel</h4>
            <div>
              <label className="flex items-center gap-2">
              <input
                  type="checkbox"
                  checked={props.showCarouselControls !== false}
                  onChange={(e) => setProp((props: any) => (props.showCarouselControls = e.target.checked))}
                  className="rounded border-gray-300"
                />
                <span className="text-xs text-gray-700">Mostrar controles de navegação</span>
              </label>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Intervalo de troca (ms)
              </label>
              <input
                type="number"
                value={props.autoPlayInterval || 3000}
                onChange={(e) => setProp((props: any) => (props.autoPlayInterval = parseInt(e.target.value) || 3000))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1000"
                step="500"
              />
            </div>
          </div>
        )}
        </div>

            {/* Seção de Imagens do Carousel Mobile */}
          <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Imagens do Hero (Mobile)</h3>
              <p className="text-xs text-gray-600 mb-3">
                {backgroundImagesMobile.length === 0 
                  ? 'Adicione imagens otimizadas para dispositivos móveis. Se não houver imagens mobile, as imagens desktop serão usadas como fallback.'
                  : backgroundImagesMobile.length === 1
                  ? 'Você tem 1 imagem mobile. Adicione mais imagens para criar um carousel automático que troca a cada 3 segundos.'
                  : `Você tem ${backgroundImagesMobile.length} imagens mobile. O carousel troca automaticamente a cada 3 segundos.`
                }
              </p>
              
              {/* Lista de imagens mobile */}
              <div className="space-y-3 mb-3">
                {backgroundImagesMobile.length === 0 ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <ImagePlus className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-2">Nenhuma imagem mobile adicionada</p>
                    <p className="text-xs text-gray-500">Clique em "Adicionar Imagem Mobile" abaixo para começar</p>
                  </div>
                ) : (
                  backgroundImagesMobile.map((image, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-start gap-3">
                      <div className="relative w-20 h-20 flex-shrink-0 rounded overflow-hidden bg-gray-100">
                        <img
                          src={image.imageUrl}
                          alt={`Hero image mobile ${index + 1}`}
                          className="w-full h-full object-cover"
            />
          </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-gray-700">
                            Imagem Mobile {index + 1}
                          </span>
                          <div 
                            className="flex gap-1" 
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                          >
                            <button
                              type="button"
                              data-modal-button="true"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                              }}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                console.log('[HeroBannerSettings] Botão mover mobile para cima clicado', { index });
                                handleMoveImageMobile(index, 'up');
                              }}
                              disabled={index === 0}
                              className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                              title="Mover para cima"
                              style={{ pointerEvents: 'auto', zIndex: 10 }}
                            >
                              <ArrowUp className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              data-modal-button="true"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                              }}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                console.log('[HeroBannerSettings] Botão mover mobile para baixo clicado', { index });
                                handleMoveImageMobile(index, 'down');
                              }}
                              disabled={index === backgroundImagesMobile.length - 1}
                              className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                              title="Mover para baixo"
                              style={{ pointerEvents: 'auto', zIndex: 10 }}
                            >
                              <ArrowDown className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              data-modal-button="true"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                              }}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                console.log('[HeroBannerSettings] Botão remover mobile clicado', { index });
                                handleRemoveImageMobile(index);
                              }}
                              className="p-1 text-red-500 hover:text-red-700 transition-colors"
                              title="Remover imagem"
                              style={{ pointerEvents: 'auto', zIndex: 10 }}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                        <input
                          type="text"
                          value={image.link}
                          onChange={(e) => handleUpdateImageLinkMobile(index, e.target.value)}
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="Link de redirecionamento (ex: /produtos, https://exemplo.com)"
                        />
                      </div>
                    </div>
                  </div>
                  ))
                )}
              </div>
              
              {/* Botão para adicionar imagem mobile */}
            <div>
              <input
                  ref={fileInputMobileRef}
                  type="file"
                  accept="image/*"
                  id="hero-banner-image-mobile-input"
                  className="hidden"
                  onChange={(e) => {
                    console.log('[HeroBannerSettings] Input file mobile onChange disparado', e.target.files);
                    const file = e.target.files?.[0];
                    if (file) {
                      console.log('[HeroBannerSettings] Arquivo mobile selecionado:', file.name, file.type, file.size);
                      handleAddImageMobile(file);
                    }
                    // Resetar input para permitir selecionar o mesmo arquivo novamente
                    if (fileInputMobileRef.current) {
                      fileInputMobileRef.current.value = '';
                    }
                  }}
                />
                <label
                  htmlFor="hero-banner-image-mobile-input"
                  className={`w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                    isUploading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  style={{ pointerEvents: isUploading ? 'none' : 'auto' }}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Fazendo upload...
                    </>
                  ) : (
                    <>
                      <ImagePlus className="h-4 w-4" />
                      Adicionar Imagem Mobile
                    </>
                  )}
                </label>
            </div>
          </div>
        </div>
      </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-end">
        <button
          type="button"
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

HeroBanner.craft = {
  displayName: 'Hero Banner',
  props: {
    backgroundImages: [], // Array de URLs das imagens de fundo (desktop)
    backgroundImagesMobile: [], // Array de URLs das imagens de fundo (mobile)
    backgroundImage: '', // Mantido para compatibilidade (será convertido para array)
    cta1Text: 'Ver Coleção',
    cta1Link: '/produtos?filter=featured',
    cta1BackgroundColor: '#C2185B',
    cta1TextColor: '#FFFFFF',
    cta2Text: 'Explorar Tudo',
    cta2Link: '/produtos',
    cta2BackgroundColor: '#FFFFFF',
    cta2TextColor: '#C2185B',
    showCarouselControls: true,
    autoPlayInterval: 3000,
  },
  // IMPORTANTE: Tornar o HeroBanner um canvas para que os EditableText dentro dele
  // sejam tratados como nós filhos individuais, cada um com suas próprias props
  isCanvas: true,
  rules: {
    canMoveIn: () => false,
    canMoveOut: () => false,
  },
  related: {
    settings: HeroBannerSettings,
  },
}
