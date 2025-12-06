'use client'

import React, { useRef, useState } from 'react';
import Link from "next/link";
import { ImagePlus } from "lucide-react";
import { Button } from "../ui/button";
import { useSafeNode } from "../../lib/hooks/use-safe-node";
import { EditableText } from "../common/editable-text";
import { useNode, Element } from '@craftjs/core';

// Componente para editar links que sincroniza com props do HeroBanner
function EditableLinkInput({ id, value, onSave }: { id: string; value: string; onSave: (newLink: string) => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value.replace(/^\//, ''));
  
  React.useEffect(() => {
    setLocalValue(value.replace(/^\//, ''));
  }, [value]);

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    const newLink = localValue.trim();
    onSave(newLink);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setLocalValue(value.replace(/^\//, ''));
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          autoFocus
          className="text-sm text-gray-700 font-mono bg-white px-2 py-1 rounded border-2 border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[200px]"
        />
        <button
          onClick={handleSave}
          className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          ✓
        </button>
        <button
          onClick={handleCancel}
          className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <span
      onDoubleClick={handleDoubleClick}
      className="text-sm text-gray-700 font-mono bg-gray-50 px-2 py-1 rounded border border-gray-200 cursor-text hover:border-blue-300 transition-colors"
      title="Duplo clique para editar"
    >
      {value.replace(/^\//, '')}
    </span>
  );
}

export function HeroBanner({ children: craftChildren }: { children?: React.ReactNode }) {
  const safeNode = useSafeNode();
  const { connectors } = safeNode;
  const { connect } = connectors;
  const isInEditor = 'isInEditor' in safeNode ? safeNode.isInEditor : false;
  
  // Verificar se está no editor através da URL
  const [isInEditorRoute, setIsInEditorRoute] = React.useState(false);
  
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsInEditorRoute(window.location.pathname.includes('/editor'));
    }
  }, []);
  
  // Obter props do Craft.js para a imagem de fundo e botões CTA
  let craftProps: { 
    backgroundImage?: string;
    cta1Text?: string;
    cta1Link?: string;
    cta2Text?: string;
    cta2Link?: string;
  } = {};
  let nodeActions: { setProp: (callback: (props: any) => void) => void } | null = null;
  
  try {
    const node = useNode((node) => ({
      backgroundImage: node.data.props.backgroundImage || '',
      cta1Text: node.data.props.cta1Text || 'Ver Coleção',
      cta1Link: node.data.props.cta1Link || '/produtos?filter=featured',
      cta2Text: node.data.props.cta2Text || 'Explorar Tudo',
      cta2Link: node.data.props.cta2Link || '/produtos',
    }));
    const fullNode = useNode();
    craftProps = {
      backgroundImage: node.backgroundImage,
      cta1Text: node.cta1Text,
      cta1Link: node.cta1Link,
      cta2Text: node.cta2Text,
      cta2Link: node.cta2Link,
    };
    nodeActions = fullNode.actions;
  } catch (e) {
    // Não está no contexto do editor
  }
  
  const setProp = nodeActions?.setProp || (() => {});
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Obter nodes filhos do Craft.js quando estiver no editor
  let nodeData: { childNodes: string[] } | null = null;
  
  // useNode sempre deve ser chamado (regra dos hooks do React)
  try {
    const node = useNode((node) => ({
      childNodes: node.data.nodes || [],
    }));
    nodeData = node;
  } catch (e) {
    // Não está no contexto do editor - isso é esperado fora do editor
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
          }
        }
      });
    }
    
    return map;
  }, [craftChildren]);

  // Função auxiliar para renderizar um EditableText baseado no ID
  // No editor, usa o node filho do Craft.js (do children prop). Fora do editor, usa children do layout salvo ou valores padrão
  const renderEditableText = React.useCallback((id: string, defaultProps: any) => {
    // Usar o mapa de children (funciona tanto no editor quanto fora)
    if (childNodesMap.has(id)) {
      return childNodesMap.get(id)!;
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
    return (
      <EditableText
        key={id}
        id={id}
        {...defaultProps}
      />
    );
  }, [isInEditor, childNodesMap]);


  // Função para lidar com upload de imagem de fundo
  const handleBackgroundImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
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
        props.backgroundImage = imageUrl;
      });
    };
    reader.onerror = () => {
      alert('Erro ao processar imagem. Tente novamente.');
    };
    reader.readAsDataURL(file);
  };

  // Obter URL da imagem de fundo (do Craft.js ou padrão)
  const defaultBackgroundImage = "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1920&h=1080&fit=crop";
  const backgroundImageUrl = isInEditor && craftProps.backgroundImage 
    ? craftProps.backgroundImage 
    : defaultBackgroundImage;

  return (
    <section 
      ref={(ref: HTMLElement | null) => { if (ref) connect(ref) }} 
      className="relative h-[85vh] min-h-[600px] overflow-hidden"
      style={{ zIndex: 0 }}
    >
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={backgroundImageUrl}
          alt="Coleção de Natal"
          className="w-full h-full object-cover md:blur-0 blur-[10px]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-charcoal/70 via-charcoal/40 to-transparent" />
        
        {/* Botão de upload - apenas no editor */}
        {isInEditor && isInEditorRoute && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleBackgroundImageUpload}
            />
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 hover:bg-white shadow-lg flex items-center justify-center transition-all z-10 group/btn"
              title="Alterar imagem de fundo"
            >
              <ImagePlus className="w-5 h-5 text-gray-700 group-hover/btn:text-primary transition-colors" />
            </button>
          </>
        )}
      </div>

      {/* Content - Wrapper principal */}
      {/* Content */}
      <div className="relative container mx-auto px-4 h-full flex items-center md:justify-start justify-center">
        <div className="max-w-xl animate-fade-up w-full md:w-auto text-center md:text-left">
          {/* Renderizar cada EditableText nas posições corretas
              No editor, cada um será um node filho individual do Craft.js */}
          <div className="mb-6 md:mb-4">
            {renderEditableText("node_hero_text_1", {
              tag: "span",
              className: "inline-block text-sm text-white tracking-[0.3em] uppercase font-body",
              content: "Nova Coleção"
            })}
          </div>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl leading-tight mb-8 md:mb-6">
            {renderEditableText("node_hero_text_2", {
              tag: "span",
              className: "text-gold",
              content: "Estilo em"
            })}
            <br />
            {renderEditableText("node_hero_text_3", {
              tag: "span",
              className: "text-white",
              content: "Cada Detalhe"
            })}
          </h2>
          <div className="mb-10 md:mb-8">
            {renderEditableText("node_hero_text_4", {
              tag: "p",
              className: "text-white font-body text-base md:text-lg max-w-md mx-auto md:mx-0 leading-relaxed",
              content: "Descubra peças exclusivas que combinam sofisticação e estilo. Qualidade e elegância em cada detalhe."
            })}
          </div>
          <div className="flex flex-col gap-4 md:flex-row md:gap-4">
            {/* Primeiro Botão CTA */}
            <Button asChild size="xl" className="w-full md:w-auto">
              <Link href={craftProps.cta1Link || '/produtos?filter=featured'}>
                {renderEditableText("node_hero_cta1_text", {
                  tag: "span",
                  className: "",
                  content: craftProps.cta1Text || "Ver Coleção"
                })}
              </Link>
            </Button>
            {/* Segundo Botão CTA */}
            <Button asChild size="xl" variant="elegant" className="w-full md:w-auto">
              <Link 
                className='border-primary text-white hover:bg-primary hover:text-white' 
                href={craftProps.cta2Link || '/produtos'}
              >
                {renderEditableText("node_hero_cta2_text", {
                  tag: "span",
                  className: "text-white",
                  content: craftProps.cta2Text || "Explorar Tudo"
                })}
              </Link>
            </Button>
          </div>
          
          {/* Links editáveis - apenas no editor */}
          {isInEditor && isInEditorRoute && (
            <div className="mt-4 p-4 bg-white/90 rounded-lg border border-gray-200 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Link do Botão 1</label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">/</span>
                  <EditableLinkInput
                    id="node_hero_cta1_link"
                    value={craftProps.cta1Link || '/produtos?filter=featured'}
                    onSave={(newLink) => {
                      if (nodeActions) {
                        nodeActions.setProp((props: any) => {
                          props.cta1Link = newLink.startsWith('/') ? newLink : `/${newLink}`;
                        });
                      }
                    }}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Link do Botão 2</label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">/</span>
                  <EditableLinkInput
                    id="node_hero_cta2_link"
                    value={craftProps.cta2Link || '/produtos'}
                    onSave={(newLink) => {
                      if (nodeActions) {
                        nodeActions.setProp((props: any) => {
                          props.cta2Link = newLink.startsWith('/') ? newLink : `/${newLink}`;
                        });
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-0 right-0 flex flex-col items-center justify-center gap-2 animate-bounce">
        {renderEditableText("node_hero_text_5", {
          tag: "span",
          className: "text-secondary/60 text-xs tracking-widest uppercase font-body text-center block",
          content: "Role"
        })}
        <div className="w-px h-12 bg-gradient-to-b from-secondary/60 to-transparent" />
      </div>
    </section>
  );
}

// Componente de Settings para editar links dos botões CTA
function HeroBannerSettings() {
  let nodeData: {
    actions: { setProp: (callback: (props: any) => void) => void }
    props: {
      cta1Text?: string
      cta1Link?: string
      cta2Text?: string
      cta2Link?: string
    }
  } | null = null

  try {
    const node = useNode((node) => ({
      props: {
        cta1Text: node.data.props.cta1Text || 'Ver Coleção',
        cta1Link: node.data.props.cta1Link || '/produtos?filter=featured',
        cta2Text: node.data.props.cta2Text || 'Explorar Tudo',
        cta2Link: node.data.props.cta2Link || '/produtos',
      },
    }))
    nodeData = {
      actions: node.actions,
      props: node.props,
    }
  } catch {
    return null
  }

  const { actions: { setProp }, props } = nodeData

  return (
    <div className="space-y-4 p-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Botões CTA</h3>
        
        {/* Primeiro Botão */}
        <div className="space-y-3 mb-4 p-3 border border-gray-200 rounded-lg">
          <h4 className="text-xs font-medium text-gray-700 uppercase tracking-wide">Botão 1</h4>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Texto</label>
            <input
              type="text"
              value={props.cta1Text || 'Ver Coleção'}
              onChange={(e) => setProp((props: any) => (props.cta1Text = e.target.value))}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ver Coleção"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Link (URL)</label>
            <input
              type="text"
              value={props.cta1Link || '/produtos?filter=featured'}
              onChange={(e) => setProp((props: any) => (props.cta1Link = e.target.value))}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="/produtos?filter=featured"
            />
          </div>
        </div>

        {/* Segundo Botão */}
        <div className="space-y-3 p-3 border border-gray-200 rounded-lg">
          <h4 className="text-xs font-medium text-gray-700 uppercase tracking-wide">Botão 2</h4>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Texto</label>
            <input
              type="text"
              value={props.cta2Text || 'Explorar Tudo'}
              onChange={(e) => setProp((props: any) => (props.cta2Text = e.target.value))}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Explorar Tudo"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Link (URL)</label>
            <input
              type="text"
              value={props.cta2Link || '/produtos'}
              onChange={(e) => setProp((props: any) => (props.cta2Link = e.target.value))}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="/produtos"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

HeroBanner.craft = {
  displayName: 'Hero Banner',
  props: {
    backgroundImage: '', // URL da imagem de fundo
    cta1Text: 'Ver Coleção',
    cta1Link: '/produtos?filter=featured',
    cta2Text: 'Explorar Tudo',
    cta2Link: '/produtos',
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
