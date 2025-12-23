'use client'

import React, { useState, useEffect, useRef } from "react";
import { Instagram, Settings, X } from "lucide-react";
import { useSafeNode } from "../../lib/hooks/use-safe-node";
import { useNode } from '@craftjs/core';
import { createPortal } from 'react-dom';
import Script from 'next/script';
import { InstagramEmbedsScroll } from '../common/instagram-embeds-scroll';

export function InstagramFeed() {
  const safeNode = useSafeNode();
  const { connectors: { connect } } = safeNode;
  const isInEditor = 'isInEditor' in safeNode ? safeNode.isInEditor : false;
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isInEditorMode, setIsInEditorMode] = React.useState(false);

  // Obter props do Craft.js
  let craftProps: {
    instagramUsername?: string;
    instagramLink?: string;
    instagramEmbeds?: string[]; // Array de até 3 embeds HTML
  } = {};
  let nodeActions: { setProp: (callback: (props: any) => void) => void } | null = null;
  let hasCraftContext = false;

  try {
    const node = useNode((node) => ({
      instagramUsername: node.data.props.instagramUsername || '',
      instagramLink: node.data.props.instagramLink || '',
      instagramEmbeds: node.data.props.instagramEmbeds || [],
    }));
    const fullNode = useNode();
    craftProps = {
      instagramUsername: node.instagramUsername,
      instagramLink: node.instagramLink,
      instagramEmbeds: node.instagramEmbeds,
    };
    nodeActions = fullNode.actions;
    hasCraftContext = true;
  } catch (e) {
    hasCraftContext = false;
  }

  React.useEffect(() => {
    setMounted(true);
  }, []);

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
    
    const shouldBeInEditor = isPreviewPage && isEditable && isInIframe && hasCraftContext;
    setIsInEditorMode(shouldBeInEditor);
  }, [hasCraftContext]);

  const setProp = nodeActions?.setProp || (() => {});

  const handleUsernameChange = (username: string) => {
    setProp((props: any) => {
      props.instagramUsername = username;
    });
  };

  const handleLinkChange = (link: string) => {
    setProp((props: any) => {
      props.instagramLink = link;
    });
  };

  const handleEmbedsChange = (embeds: string[]) => {
    setProp((props: any) => {
      props.instagramEmbeds = embeds;
    });
  };

  // Declarar variáveis antes de usar nos useEffect
  const instagramUsername = craftProps.instagramUsername || 'flordemeninaoficial';
  const instagramLink = craftProps.instagramLink || `https://instagram.com/${instagramUsername}`;
  const embeds = craftProps.instagramEmbeds || [];

  // Processar embeds do Instagram quando o script carregar ou quando os embeds mudarem
  useEffect(() => {
    if (embeds.length > 0 && mounted && typeof window !== 'undefined') {
      // Aguardar o script carregar e o DOM estar pronto
      const processEmbeds = () => {
        if (window.instgrm && window.instgrm.Embeds) {
          window.instgrm.Embeds.process();
        } else {
          // Se o script ainda não carregou, tentar novamente
          setTimeout(processEmbeds, 200);
        }
      };

      // Aguardar um pouco para garantir que o DOM foi atualizado
      const timer = setTimeout(processEmbeds, 300);

      return () => clearTimeout(timer);
    }
  }, [embeds, mounted]);

  // Handler para quando o script do Instagram carregar
  const handleScriptLoad = () => {
    if (typeof window !== 'undefined' && embeds.length > 0 && mounted) {
      // Aguardar um pouco para garantir que o DOM foi atualizado
      setTimeout(() => {
        if (window.instgrm && window.instgrm.Embeds) {
          window.instgrm.Embeds.process();
        }
      }, 300);
    }
  };

  // Renderizar modal de configurações apenas no editor
  const settingsModal = showSettingsModal && isInEditorMode && mounted ? (
    <InstagramFeedSettings
      instagramUsername={instagramUsername}
      instagramLink={instagramLink}
      instagramEmbeds={embeds}
      onUsernameChange={handleUsernameChange}
      onLinkChange={handleLinkChange}
      onEmbedsChange={handleEmbedsChange}
      onClose={() => setShowSettingsModal(false)}
      isOpen={showSettingsModal}
    />
  ) : null;

  return (
    <>
      {/* Script do Instagram - carregar apenas se houver embeds */}
      {embeds.length > 0 && (
        <Script
          src="https://www.instagram.com/embed.js"
          strategy="afterInteractive"
          onLoad={handleScriptLoad}
        />
      )}
      {settingsModal}
      <section ref={(ref: HTMLElement | null) => { if (ref) connect(ref) }} className="py-16 relative overflow-x-hidden">
        {/* Botão para abrir configurações - apenas no editor */}
        {isInEditorMode && mounted && (
          <button
            data-modal-button="true"
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowSettingsModal(true);
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 hover:bg-white shadow-lg flex items-center justify-center transition-all z-[100] group/btn"
            title="Configurar Instagram Feed"
            style={{ pointerEvents: 'auto', cursor: 'pointer' }}
          >
            <Settings 
              className="w-5 h-5 text-gray-700 group-hover/btn:text-primary transition-colors pointer-events-none" 
              style={{ pointerEvents: 'none' }}
            />
          </button>
        )}
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <a
              href={instagramLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 text-foreground hover:text-primary transition-colors group"
            >
              <Instagram size={24} />
              <span className="font-display text-2xl lg:text-3xl">@{instagramUsername}</span>
            </a>
            <p className="text-muted-foreground font-body text-sm mt-2">
              Siga-nos para mais inspiração
            </p>
          </div>

          {/* Renderizar embeds se houver, senão mostrar grid de imagens padrão */}
          {embeds.length > 0 && mounted ? (
            <InstagramEmbedsScroll embeds={embeds} />
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {[
                "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=400&fit=crop",
                "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400&h=400&fit=crop",
                "https://images.unsplash.com/photo-1581044777550-4cfa60707c03?w=400&h=400&fit=crop",
                "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400&h=400&fit=crop",
                "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=400&h=400&fit=crop",
                "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=400&h=400&fit=crop",
              ].map((post, index) => (
                <a
                  key={index}
                  href={instagramLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative aspect-square overflow-hidden group"
                >
                  <img
                    src={post}
                    alt={`Instagram post ${index + 1}`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/30 transition-colors flex items-center justify-center">
                    <Instagram
                      size={24}
                      className="text-primary-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

// Componente de Settings para configurar Instagram Feed
function InstagramFeedSettings({
  instagramUsername,
  instagramLink,
  instagramEmbeds,
  onUsernameChange,
  onLinkChange,
  onEmbedsChange,
  onClose,
  isOpen,
}: {
  instagramUsername: string;
  instagramLink: string;
  instagramEmbeds: string[];
  onUsernameChange: (username: string) => void;
  onLinkChange: (link: string) => void;
  onEmbedsChange: (embeds: string[]) => void;
  onClose: () => void;
  isOpen: boolean;
}) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [localUsername, setLocalUsername] = useState(instagramUsername);
  const [localLink, setLocalLink] = useState(instagramLink);
  const [localEmbeds, setLocalEmbeds] = useState<string[]>(instagramEmbeds);

  // Sincronizar com props quando mudarem
  useEffect(() => {
    setLocalUsername(instagramUsername);
  }, [instagramUsername]);

  useEffect(() => {
    setLocalLink(instagramLink);
  }, [instagramLink]);

  useEffect(() => {
    setLocalEmbeds(instagramEmbeds);
  }, [instagramEmbeds]);

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

  const handleEmbedChange = (index: number, value: string) => {
    const newEmbeds = [...localEmbeds];
    newEmbeds[index] = value;
    setLocalEmbeds(newEmbeds);
    onEmbedsChange(newEmbeds);
  };

  const handleAddEmbed = () => {
    if (localEmbeds.length < 3) {
      const newEmbeds = [...localEmbeds, ''];
      setLocalEmbeds(newEmbeds);
      onEmbedsChange(newEmbeds);
    }
  };

  const handleRemoveEmbed = (index: number) => {
    const newEmbeds = localEmbeds.filter((_, i) => i !== index);
    setLocalEmbeds(newEmbeds);
    onEmbedsChange(newEmbeds);
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
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Configurar Instagram Feed</h3>
            <p className="text-sm text-gray-500 mt-1">
              Configure o @ do Instagram, link e até 3 embeds
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              @ do Instagram
            </label>
            <input
              type="text"
              value={localUsername}
              onChange={(e) => {
                const value = e.target.value.replace('@', ''); // Remover @ se o usuário digitar
                setLocalUsername(value);
                onUsernameChange(value);
              }}
              placeholder="flordemeninaoficial"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              data-modal-button="true"
            />
            <p className="text-xs text-gray-500 mt-1">
              Digite o username sem o @
            </p>
          </div>

          {/* Link */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Link do Instagram
            </label>
            <input
              type="url"
              value={localLink}
              onChange={(e) => {
                setLocalLink(e.target.value);
                onLinkChange(e.target.value);
              }}
              placeholder="https://instagram.com/flordemeninaoficial"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              data-modal-button="true"
            />
            <p className="text-xs text-gray-500 mt-1">
              URL completa do perfil do Instagram
            </p>
          </div>

          {/* Embeds */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Embeds do Instagram (máximo 3)
              </label>
              {localEmbeds.length < 3 && (
                <button
                  type="button"
                  onClick={handleAddEmbed}
                  className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                  data-modal-button="true"
                >
                  Adicionar Embed
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500 mb-4">
              Cole o código HTML completo do embed do Instagram (blockquote + script)
            </p>
            
            {localEmbeds.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                <p className="text-sm text-gray-500 mb-4">Nenhum embed adicionado</p>
                <button
                  type="button"
                  onClick={handleAddEmbed}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                  data-modal-button="true"
                >
                  Adicionar Primeiro Embed
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {localEmbeds.map((embed, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-gray-700">
                        Embed {index + 1}
                      </label>
                      <button
                        type="button"
                        onClick={() => handleRemoveEmbed(index)}
                        className="text-red-500 hover:text-red-700 text-sm"
                        data-modal-button="true"
                      >
                        Remover
                      </button>
                    </div>
                    <textarea
                      value={embed}
                      onChange={(e) => handleEmbedChange(index, e.target.value)}
                      placeholder="Cole o código HTML do embed aqui..."
                      rows={8}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs"
                      data-modal-button="true"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-end">
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

// Declaração global para TypeScript
declare global {
  interface Window {
    instgrm?: {
      Embeds: {
        process: () => void;
      };
    };
  }
}

InstagramFeed.craft = {
  displayName: 'Instagram Feed',
  props: {
    instagramUsername: 'flordemeninaoficial',
    instagramLink: 'https://instagram.com/flordemeninaoficial',
    instagramEmbeds: [],
  },
  isCanvas: false,
  rules: {
    canMoveIn: () => false,
    canMoveOut: () => false,
  },
}
