'use client'

import React, { useState } from 'react';
import Link from "next/link";
import { Button } from "../ui/button";
import { useSafeNode } from "../../lib/hooks/use-safe-node";
import { EditableText } from "../common/editable-text";
import { EditableImage } from "../common/editable-image";
import { EditableButton } from "../common/editable-button";
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
    cta1BackgroundColor?: string;
    cta1TextColor?: string;
    cta2Text?: string;
    cta2Link?: string;
    cta2BackgroundColor?: string;
    cta2TextColor?: string;
  } = {};
  let nodeActions: { setProp: (callback: (props: any) => void) => void } | null = null;
  
  try {
    const node = useNode((node) => ({
      backgroundImage: node.data.props.backgroundImage || '',
      cta1Text: node.data.props.cta1Text || 'Ver Coleção',
      cta1Link: node.data.props.cta1Link || '/produtos?filter=featured',
      cta1BackgroundColor: node.data.props.cta1BackgroundColor || '',
      cta1TextColor: node.data.props.cta1TextColor || '',
      cta2Text: node.data.props.cta2Text || 'Explorar Tudo',
      cta2Link: node.data.props.cta2Link || '/produtos',
      cta2BackgroundColor: node.data.props.cta2BackgroundColor || '',
      cta2TextColor: node.data.props.cta2TextColor || '',
    }));
    const fullNode = useNode();
    craftProps = {
      backgroundImage: node.backgroundImage,
      cta1Text: node.cta1Text,
      cta1Link: node.cta1Link,
      cta1BackgroundColor: node.cta1BackgroundColor,
      cta1TextColor: node.cta1TextColor,
      cta2Text: node.cta2Text,
      cta2Link: node.cta2Link,
      cta2BackgroundColor: node.cta2BackgroundColor,
      cta2TextColor: node.cta2TextColor,
    };
    nodeActions = fullNode.actions;
  } catch (e) {
    // Não está no contexto do editor
  }
  
  const setProp = nodeActions?.setProp || (() => {});
  
  // Escutar atualizações dos botões editáveis e sincronizar com as props do HeroBanner
  React.useEffect(() => {
    if (!isInEditor) return
    
    const handleButtonUpdate = (event: CustomEvent) => {
      const { buttonId, text, backgroundColor, textColor } = event.detail
      
      if (buttonId === 'node_hero_cta1_button') {
        setProp((props: any) => {
          props.cta1Text = text
          if (backgroundColor) props.cta1BackgroundColor = backgroundColor
          if (textColor) props.cta1TextColor = textColor
        })
      } else if (buttonId === 'node_hero_cta2_button') {
        setProp((props: any) => {
          props.cta2Text = text
          if (backgroundColor) props.cta2BackgroundColor = backgroundColor
          if (textColor) props.cta2TextColor = textColor
        })
      }
    }
    
    window.addEventListener('editable-button-updated' as any, handleButtonUpdate as EventListener)
    
    return () => {
      window.removeEventListener('editable-button-updated' as any, handleButtonUpdate as EventListener)
    }
  }, [isInEditor, setProp])
  
  // Sincronizar props dos botões editáveis com as props do HeroBanner quando as props do HeroBanner mudarem
  // Isso garante que mudanças feitas no HeroBanner sejam refletidas nos botões
  React.useEffect(() => {
    if (!isInEditor || !nodeActions) return
    
    // As props já estão sendo passadas para o Element, então o Craft.js cuida da sincronização
    // Este effect é apenas para garantir que mudanças externas sejam refletidas
  }, [craftProps.cta1Text, craftProps.cta1BackgroundColor, craftProps.cta1TextColor, craftProps.cta2Text, craftProps.cta2BackgroundColor, craftProps.cta2TextColor, isInEditor, nodeActions])
  
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
    // Isso é usado quando os nodes já existem no Craft.js (do layout salvo ou já criados)
    if (childNodesMap.has(id)) {
      return childNodesMap.get(id)!;
    }
    
    // Se estiver no editor e não encontrou no mapa, criar um novo Element
    // Cada Element com ID único cria um nó separado no Craft.js
    // Isso garante que cada texto tenha seu próprio estado isolado
    if (isInEditor) {
      // O id do Element é usado pelo Craft.js para criar o Linked Node
      // O id dentro das props é usado pelo EditableText para identificar qual nó ele representa
      // Garantir que o id seja passado para o EditableText através das props
      const { id: _, ...propsWithoutId } = defaultProps
      return (
        <Element
          key={id}
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
        <EditableImage
          src={backgroundImageUrl}
          alt="Coleção de Natal"
          className="w-full h-full object-cover md:blur-0 blur-[10px]"
          imageProp="backgroundImage"
          buttonPosition="top-right"
          onImageChange={(url) => {
            if (nodeActions) {
              nodeActions.setProp((props: any) => {
                props.backgroundImage = url;
              });
            }
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-charcoal/70 via-charcoal/40 to-transparent" />
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
              className: "inline-block text-sm tracking-[0.3em] uppercase font-body",
              content: "Coleção Festas 2024"
            })}
          </div>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl leading-tight mb-8 md:mb-6">
            {renderEditableText("node_hero_text_2", {
              tag: "span",
              className: "",
              content: "Elegância em"
            })}
            <br />
            {renderEditableText("node_hero_text_3", {
              tag: "span",
              className: "",
              content: "Vermelho & Branco"
            })}
          </h2>
          <div className="mb-10 md:mb-8">
            {renderEditableText("node_hero_text_4", {
              tag: "p",
              className: "text-secondary/80 font-body text-base md:text-lg max-w-md mx-auto md:mx-0 leading-relaxed",
              content: "Descubra peças exclusivas para brilhar nas festas de fim de ano. Sofisticação e estilo que traduzem a essência feminina."
            })}
          </div>
          <div className="flex flex-col gap-4 md:flex-row md:gap-4">
            {/* Primeiro Botão CTA */}
            <Button 
              asChild 
              size="xl" 
              className="w-full md:w-auto"
              style={{
                ...(craftProps.cta1BackgroundColor && { backgroundColor: craftProps.cta1BackgroundColor }),
                ...(craftProps.cta1TextColor && { color: craftProps.cta1TextColor }),
              }}
            >
              <Link href={craftProps.cta1Link || '/produtos?filter=featured'}>
                <Element
                  is={EditableButton}
                  id="node_hero_cta1_button"
                  text={craftProps.cta1Text || "Ver Coleção"}
                  backgroundColor={craftProps.cta1BackgroundColor || ''}
                  textColor={craftProps.cta1TextColor || ''}
                  asChild
                  onUpdate={(props) => {
                    if (nodeActions) {
                      nodeActions.setProp((p: any) => {
                        p.cta1Text = props.text
                        if (props.backgroundColor) p.cta1BackgroundColor = props.backgroundColor
                        if (props.textColor) p.cta1TextColor = props.textColor
                      })
                    }
                  }}
                />
              </Link>
            </Button>
            {/* Segundo Botão CTA */}
            <Button 
              asChild 
              size="xl" 
              variant="elegant" 
              className="w-full md:w-auto"
              style={{
                ...(craftProps.cta2BackgroundColor && { backgroundColor: craftProps.cta2BackgroundColor }),
                ...(craftProps.cta2TextColor && { color: craftProps.cta2TextColor }),
                ...(craftProps.cta2BackgroundColor && { borderColor: craftProps.cta2BackgroundColor }),
              }}
            >
              <Link 
                className={craftProps.cta2BackgroundColor ? '' : 'border-primary hover:bg-primary hover:text-white'}
                href={craftProps.cta2Link || '/produtos'}
              >
                <Element
                  is={EditableButton}
                  id="node_hero_cta2_button"
                  text={craftProps.cta2Text || "Explorar Tudo"}
                  backgroundColor={craftProps.cta2BackgroundColor || ''}
                  textColor={craftProps.cta2TextColor || ''}
                  asChild
                  onUpdate={(props) => {
                    if (nodeActions) {
                      nodeActions.setProp((p: any) => {
                        p.cta2Text = props.text
                        if (props.backgroundColor) p.cta2BackgroundColor = props.backgroundColor
                        if (props.textColor) p.cta2TextColor = props.textColor
                      })
                    }
                  }}
                />
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
      cta1BackgroundColor?: string
      cta1TextColor?: string
      cta2Text?: string
      cta2Link?: string
      cta2BackgroundColor?: string
      cta2TextColor?: string
    }
  } | null = null

  try {
    const node = useNode((node) => ({
      props: {
        cta1Text: node.data.props.cta1Text || 'Ver Coleção',
        cta1Link: node.data.props.cta1Link || '/produtos?filter=featured',
        cta1BackgroundColor: node.data.props.cta1BackgroundColor || '',
        cta1TextColor: node.data.props.cta1TextColor || '',
        cta2Text: node.data.props.cta2Text || 'Explorar Tudo',
        cta2Link: node.data.props.cta2Link || '/produtos',
        cta2BackgroundColor: node.data.props.cta2BackgroundColor || '',
        cta2TextColor: node.data.props.cta2TextColor || '',
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Cor de Fundo</label>
              <input
                type="color"
                value={props.cta1BackgroundColor || '#C2185B'}
                onChange={(e) => setProp((props: any) => (props.cta1BackgroundColor = e.target.value))}
                className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Cor do Texto</label>
              <input
                type="color"
                value={props.cta1TextColor || '#FFFFFF'}
                onChange={(e) => setProp((props: any) => (props.cta1TextColor = e.target.value))}
                className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
              />
            </div>
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Cor de Fundo</label>
              <input
                type="color"
                value={props.cta2BackgroundColor || '#FFFFFF'}
                onChange={(e) => setProp((props: any) => (props.cta2BackgroundColor = e.target.value))}
                className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Cor do Texto</label>
              <input
                type="color"
                value={props.cta2TextColor || '#C2185B'}
                onChange={(e) => setProp((props: any) => (props.cta2TextColor = e.target.value))}
                className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
              />
            </div>
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
    cta1BackgroundColor: '#C2185B',
    cta1TextColor: '#FFFFFF',
    cta2Text: 'Explorar Tudo',
    cta2Link: '/produtos',
    cta2BackgroundColor: '#FFFFFF',
    cta2TextColor: '#C2185B',
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
