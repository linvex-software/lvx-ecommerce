'use client'

/**
 * Frame Restrito
 * 
 * Wrapper do Frame do Craft.js que desabilita drag & drop e adicionar/remover componentes
 * Aplica os mesmos estilos globais da web para garantir consistência visual
 */

import { Frame } from '@craftjs/core'
import { useEffect, useRef } from 'react'
import { TemplateStyles } from './template-styles'
import { usePreviewMode } from './preview-context'
import { getTemplateStylesPath } from '@/lib/templates/template-loader'

interface RestrictedFrameProps {
  data?: string | null
  templateId?: string
}

export function RestrictedFrame({ data, templateId = 'woman-shop-template' }: RestrictedFrameProps) {
  const frameRef = useRef<HTMLDivElement>(null)
  const { previewMode } = usePreviewMode()
  
  // Verificar se data é válido antes de passar para o Frame
  // O Craft só deve receber data quando existir layout válido
  let safeData: string | undefined
  try {
    if (data && data.trim().length > 0) {
      const parsed = JSON.parse(data)
      safeData = parsed && Object.keys(parsed).length > 0 ? data : undefined
    }
  } catch {
    safeData = undefined
  }

  // Aplicar estilos CSS variables no frame do Craft.js
  // O Craft.js cria um iframe, então precisamos aplicar as variáveis dentro do documento do iframe
  useEffect(() => {
    const applyFrameStyles = () => {
      const frameElement = frameRef.current?.querySelector('[data-craftjs-frame]') as HTMLIFrameElement | null
      
      if (frameElement) {
        try {
          // O Craft.js cria um iframe, então precisamos acessar o documento dentro do iframe
          const iframeDoc = frameElement.contentDocument || frameElement.contentWindow?.document
          
          if (iframeDoc) {
            // Copiar todas as variáveis CSS do root para o :root do iframe
            const root = document.documentElement
            const computedStyle = getComputedStyle(root)
            const iframeRoot = iframeDoc.documentElement
            
            const cssVariables = [
              '--background', '--foreground', '--card', '--card-foreground',
              '--popover', '--popover-foreground', '--primary', '--primary-foreground',
              '--secondary', '--secondary-foreground', '--muted', '--muted-foreground',
              '--accent', '--accent-foreground', '--destructive', '--destructive-foreground',
              '--border', '--input', '--ring', '--radius',
              '--gold', '--gold-light', '--wine', '--wine-dark', '--wine-light',
              '--cream', '--beige', '--charcoal',
              '--shadow-soft', '--shadow-elevated', '--shadow-gold',
              '--font-display', '--font-body', '--font-sans'
            ]
            
            // Aplicar variáveis CSS no :root do iframe com valores explícitos do template
            // Valores do template Woman Shop Template (templates/flor-de-menina/styles.css)
            const templateVariables: Record<string, string> = {
              '--background': '0 0% 100%',
              '--foreground': '0 0% 12%',
              '--card': '30 25% 98%',
              '--card-foreground': '0 0% 12%',
              '--popover': '0 0% 100%',
              '--popover-foreground': '0 0% 12%',
              '--primary': '350 70% 35%',
              '--primary-foreground': '0 0% 100%',
              '--secondary': '30 30% 95%',
              '--secondary-foreground': '0 0% 20%',
              '--muted': '30 15% 92%',
              '--muted-foreground': '0 0% 45%',
              '--accent': '42 65% 55%',
              '--accent-foreground': '0 0% 100%',
              '--destructive': '0 84.2% 60.2%',
              '--destructive-foreground': '210 40% 98%',
              '--border': '30 20% 88%',
              '--input': '30 20% 88%',
              '--ring': '350 70% 35%',
              '--radius': '0.25rem',
              '--gold': '42 65% 55%',
              '--gold-light': '42 50% 75%',
              '--wine': '350 70% 35%',
              '--wine-dark': '350 75% 25%',
              '--wine-light': '350 60% 45%',
              '--cream': '30 30% 97%',
              '--beige': '30 25% 92%',
              '--charcoal': '0 0% 20%',
              '--font-display': "'Cormorant Garamond', Georgia, serif",
              '--font-body': "'Montserrat', system-ui, sans-serif",
              '--font-sans': "'Montserrat', system-ui, sans-serif"
            }

            // Aplicar variáveis do template primeiro (valores explícitos)
            Object.entries(templateVariables).forEach(([variable, value]) => {
              iframeRoot.style.setProperty(variable, value)
            })

            // Depois tentar copiar do root do documento (caso tenha sido sobrescrito)
            cssVariables.forEach(variable => {
              const value = computedStyle.getPropertyValue(variable).trim()
              if (value) {
                iframeRoot.style.setProperty(variable, value)
              }
            })

            // IMPORTANTE: Adicionar meta viewport baseado no preview mode
            // Isso garante que os breakpoints do Tailwind funcionem corretamente
            let viewportMeta = iframeDoc.querySelector('meta[name="viewport"]')
            const viewportWidth = previewMode === 'tablet' ? '768' : 'device-width'
            const simulatedWidth = previewMode === 'tablet' ? 768 : 1920
            const simulatedHeight = previewMode === 'tablet' ? 1024 : 1080
            
            if (!viewportMeta) {
              viewportMeta = iframeDoc.createElement('meta')
              viewportMeta.setAttribute('name', 'viewport')
              viewportMeta.setAttribute('content', `width=${viewportWidth}, initial-scale=1.0, user-scalable=no`)
              iframeDoc.head.insertBefore(viewportMeta, iframeDoc.head.firstChild)
            } else {
              // Atualizar viewport existente baseado no preview mode
              viewportMeta.setAttribute('content', `width=${viewportWidth}, initial-scale=1.0, user-scalable=no`)
            }

            // Injetar script para simular dimensões do dispositivo dentro do iframe
            // Isso faz com que window.innerWidth, window.matchMedia, etc. funcionem corretamente
            const existingSimulator = iframeDoc.getElementById('device-simulator-script')
            if (existingSimulator) {
              existingSimulator.remove()
            }
            
            const simulatorScript = iframeDoc.createElement('script')
            simulatorScript.id = 'device-simulator-script'
            simulatorScript.textContent = `
              (function() {
                const simulatedWidth = ${simulatedWidth};
                const simulatedHeight = ${simulatedHeight};
                
                // Sobrescrever window.innerWidth e window.innerHeight
                Object.defineProperty(window, 'innerWidth', {
                  get: function() { return simulatedWidth; },
                  configurable: true
                });
                
                Object.defineProperty(window, 'innerHeight', {
                  get: function() { return simulatedHeight; },
                  configurable: true
                });
                
                // Sobrescrever window.outerWidth e window.outerHeight
                Object.defineProperty(window, 'outerWidth', {
                  get: function() { return simulatedWidth; },
                  configurable: true
                });
                
                Object.defineProperty(window, 'outerHeight', {
                  get: function() { return simulatedHeight; },
                  configurable: true
                });
                
                // Sobrescrever document.documentElement.clientWidth e clientHeight
                Object.defineProperty(document.documentElement, 'clientWidth', {
                  get: function() { return simulatedWidth; },
                  configurable: true
                });
                
                Object.defineProperty(document.documentElement, 'clientHeight', {
                  get: function() { return simulatedHeight; },
                  configurable: true
                });
                
                // Sobrescrever window.matchMedia para retornar valores baseados na largura simulada
                const originalMatchMedia = window.matchMedia;
                window.matchMedia = function(query) {
                  const mediaQuery = query.replace(/\\s/g, '');
                  
                  // Parsear queries comuns
                  if (mediaQuery.includes('min-width:')) {
                    const match = mediaQuery.match(/min-width:(\\d+)px/);
                    if (match) {
                      const minWidth = parseInt(match[1]);
                      return {
                        matches: simulatedWidth >= minWidth,
                        media: query,
                        onchange: null,
                        addListener: function() {},
                        removeListener: function() {},
                        addEventListener: function() {},
                        removeEventListener: function() {},
                        dispatchEvent: function() { return true; }
                      };
                    }
                  }
                  
                  if (mediaQuery.includes('max-width:')) {
                    const match = mediaQuery.match(/max-width:(\\d+)px/);
                    if (match) {
                      const maxWidth = parseInt(match[1]);
                      return {
                        matches: simulatedWidth <= maxWidth,
                        media: query,
                        onchange: null,
                        addListener: function() {},
                        removeListener: function() {},
                        addEventListener: function() {},
                        removeEventListener: function() {},
                        dispatchEvent: function() { return true; }
                      };
                    }
                  }
                  
                  // Fallback para queries não reconhecidas
                  return originalMatchMedia.call(window, query);
                };
                
                // Forçar atualização do body width
                const updateDimensions = () => {
                  document.body.style.width = simulatedWidth + 'px';
                  document.body.style.maxWidth = simulatedWidth + 'px';
                  document.documentElement.style.width = simulatedWidth + 'px';
                  document.documentElement.style.maxWidth = simulatedWidth + 'px';
                  
                  // Disparar evento resize para componentes que dependem dele
                  window.dispatchEvent(new Event('resize'));
                };
                
                // Executar imediatamente
                updateDimensions();
                
                // Executar quando DOM estiver pronto
                if (document.readyState === 'loading') {
                  document.addEventListener('DOMContentLoaded', updateDimensions);
                }
                
                // Executar após um delay para garantir que React tenha inicializado
                setTimeout(updateDimensions, 100);
                setTimeout(updateDimensions, 500);
                setTimeout(updateDimensions, 1000);
              })();
            `
            // Inserir o script ANTES de qualquer outro script para garantir execução precoce
            // Isso faz com que window.innerWidth, matchMedia, etc. sejam sobrescritos antes do React renderizar
            // Inserir no início do head para máxima prioridade
            iframeDoc.head.insertBefore(simulatorScript, iframeDoc.head.firstChild)
            
            // O script será executado automaticamente quando inserido no DOM
            // Mas vamos também executar diretamente no contexto do iframe para garantir
            if (frameElement.contentWindow) {
              try {
                // Executar o script diretamente no contexto do iframe
                // @ts-ignore - eval existe no window, apenas não está tipado
                frameElement.contentWindow.eval(simulatorScript.textContent)
              } catch (e) {
                // Se não conseguir executar (CSP), o script já foi inserido no DOM e será executado automaticamente
                console.log('[RestrictedFrame] Script de simulação inserido no iframe')
              }
            }

            // IMPORTANTE: Carregar CSS do template PRIMEIRO, depois Tailwind
            // O CSS do template deve ter prioridade máxima sobre o Tailwind
            
            // 1. Carregar CSS compartilhado do template (CÓPIA EXATA do template1) PRIMEIRO
            const existingLink = iframeDoc.getElementById('template-shared-styles')
            if (!existingLink) {
              const stylesPath = getTemplateStylesPath(templateId)
              const link = iframeDoc.createElement('link')
              link.id = 'template-shared-styles'
              link.href = window.location.origin + stylesPath
              link.rel = 'stylesheet'
              // Carregar PRIMEIRO para garantir que tenha base
              iframeDoc.head.insertBefore(link, iframeDoc.head.firstChild)
              
              link.onload = () => {
                // Após carregar o CSS do template, carregar Tailwind DEPOIS
                const existingTailwind = iframeDoc.getElementById('tailwind-admin')
                if (!existingTailwind) {
                  const tailwindLink = iframeDoc.createElement('link')
                  tailwindLink.id = 'tailwind-admin'
                  tailwindLink.href = window.location.origin + '/_next/static/css/app.css'
                  tailwindLink.rel = 'stylesheet'
                  // Inserir DEPOIS do CSS do template
                  iframeDoc.head.appendChild(tailwindLink)
                  
                  tailwindLink.onload = () => {
                    // Após Tailwind carregar, recarregar CSS do template por cima para ter prioridade
                    const stylesPath = getTemplateStylesPath(templateId)
                    const overrideLink = iframeDoc.createElement('link')
                    overrideLink.id = 'template-styles-override'
                    overrideLink.href = window.location.origin + stylesPath
                    overrideLink.rel = 'stylesheet'
                    // Inserir no FINAL para ter prioridade máxima
                    iframeDoc.head.appendChild(overrideLink)
                    
                    overrideLink.onload = () => {
                      // IMPORTANTE: Garantir que os scripts do Next.js sejam carregados no iframe
                      // Isso é necessário para que os componentes React (incluindo ícones) sejam renderizados
                      // O Craft.js Frame já deve carregar os scripts, mas vamos garantir
                      setTimeout(() => {
                        applyFrameStyles()
                        // Executar o script de simulação após tudo carregar
                        if (simulatorScript.parentNode) {
                          // Re-executar o script para garantir que as dimensões sejam aplicadas
                          const newScript = iframeDoc.createElement('script')
                          newScript.textContent = simulatorScript.textContent
                          iframeDoc.head.appendChild(newScript)
                        }
                      }, 200)
                    }
                  }
                } else {
                  // Se Tailwind já existe, apenas aplicar estilos
                  setTimeout(() => {
                    applyFrameStyles()
                  }, 100)
                }
              }
            } else {
              // Se já existe, garantir que as variáveis estejam aplicadas
              setTimeout(applyFrameStyles, 100)
            }

            // RESET COMPLETO: Aplicar estilos base no body do iframe (exatamente como no template1)
            // FORÇAR fontes corretas para evitar herança do editor
            iframeDoc.body.style.margin = '0'
            iframeDoc.body.style.padding = '0'
            iframeDoc.body.style.fontFamily = 'var(--font-body, "Montserrat", system-ui, sans-serif) !important'
            iframeDoc.body.style.backgroundColor = 'hsl(var(--background, 0 0% 100%))'
            iframeDoc.body.style.color = 'hsl(var(--foreground, 0 0% 12%))'
            iframeDoc.body.style.webkitFontSmoothing = 'antialiased'
            iframeDoc.body.style.mozOsxFontSmoothing = 'grayscale'
            iframeDoc.body.style.lineHeight = '1.5'
            iframeDoc.body.style.letterSpacing = 'normal'

            // Garantir que o html do iframe também tenha os estilos corretos
            iframeRoot.style.scrollBehavior = 'smooth'
            iframeRoot.style.margin = '0'
            iframeRoot.style.padding = '0'
            iframeRoot.style.fontFamily = 'var(--font-body, "Montserrat", system-ui, sans-serif)'
            
            // IMPORTANTE: Garantir que o iframe tenha largura suficiente para breakpoints funcionarem
            // O breakpoint lg do Tailwind é 1024px, então precisamos garantir que o iframe tenha pelo menos essa largura
            if (frameElement) {
              // Se o iframe tiver largura menor que 1024px, forçar largura mínima
              const iframeWidth = frameElement.offsetWidth || frameElement.clientWidth
              if (iframeWidth < 1024) {
                // Não forçar largura aqui, mas garantir que o viewport seja detectado corretamente
                // O problema pode ser que o viewport não está sendo detectado corretamente
              }
            }

            // CRIAR ESTILO DE RESET COMPLETO dentro do iframe para isolar do editor
            const resetStyle = iframeDoc.createElement('style')
            resetStyle.id = 'template-iframe-reset'
            resetStyle.textContent = `
              /* ============================================
                 RESET COMPLETO DO IFRAME - ISOLAR DO EDITOR
                 ============================================ */
              /* Este reset garante que NENHUM estilo do editor interfira */
              
              /* Resetar TODAS as fontes e forçar fontes do template */
              body, body * {
                font-family: var(--font-body, "Montserrat", system-ui, sans-serif) !important;
                line-height: 1.5 !important;
                letter-spacing: normal !important;
              }

              /* FORÇAR fontes de display em TODOS os headings */
              h1, h2, h3, h4, h5, h6,
              h1 *, h2 *, h3 *, h4 *, h5 *, h6 * {
                font-family: var(--font-display, "Cormorant Garamond", Georgia, serif) !important;
                font-weight: 500 !important;
                line-height: 1.2 !important;
                letter-spacing: normal !important;
              }

              /* Resetar qualquer herança de fontes do editor */
              * {
                font-family: inherit !important;
              }

              /* Garantir que classes do template funcionem */
              .font-display,
              .font-display * {
                font-family: var(--font-display, "Cormorant Garamond", Georgia, serif) !important;
              }

              .font-body,
              .font-body * {
                font-family: var(--font-body, "Montserrat", system-ui, sans-serif) !important;
              }

              /* Resetar line-height e letter-spacing para valores padrão do template */
              body {
                line-height: 1.5 !important;
                letter-spacing: normal !important;
              }

              h1, h2, h3, h4, h5, h6 {
                line-height: 1.2 !important;
                letter-spacing: normal !important;
              }

              /* Garantir que cores do template funcionem */
              .text-secondary {
                color: hsl(var(--secondary-foreground, 0 0% 20%)) !important;
              }

              .text-gold {
                color: hsl(var(--gold, 42 65% 55%)) !important;
              }

              h2 .text-gold,
              h2 span.text-gold,
              h2 > span.text-gold {
                color: hsl(var(--gold, 42 65% 55%)) !important;
              }

              h2.text-secondary,
              h2.text-secondary *:not(.text-gold) {
                color: hsl(var(--secondary-foreground, 0 0% 20%)) !important;
              }

              /* GARANTIR que navegação desktop apareça quando o iframe tiver largura suficiente */
              /* O breakpoint lg do Tailwind é 1024px */
              /* Forçar navegação desktop a aparecer quando o viewport tiver largura >= 1024px */
              @media (min-width: 1024px) {
                /* Forçar navegação desktop a aparecer */
                nav.hidden.lg\\:flex {
                  display: flex !important;
                }
                
                /* Garantir que botão mobile menu fique oculto no desktop */
                button.lg\\:hidden {
                  display: none !important;
                }
              }
              
              /* REMOVIDO: min-width: 1024px que estava forçando desktop no mobile/tablet */
              /* Agora o viewport é configurado corretamente baseado no preview mode */
              
              /* Forçar navegação desktop quando o body tiver largura >= 1024px */
              @media (min-width: 1024px) {
                header nav.hidden {
                  display: flex !important;
                }
                
                header button.lg\\:hidden {
                  display: none !important;
                }
              }

              /* GARANTIR que ícones SVG do lucide-react sejam renderizados corretamente */
              /* Os ícones são componentes SVG que precisam ter display e tamanho corretos */
              svg {
                display: inline-block !important;
                vertical-align: middle !important;
                width: 1em !important;
                height: 1em !important;
                fill: currentColor !important;
                stroke: currentColor !important;
                stroke-width: 2 !important;
                stroke-linecap: round !important;
                stroke-linejoin: round !important;
              }

              /* Garantir que ícones dentro de links e botões sejam visíveis */
              a svg,
              button svg {
                display: inline-block !important;
                width: 20px !important;
                height: 20px !important;
                flex-shrink: 0 !important;
              }

              /* Garantir que textos sejam visíveis e tenham cor correta */
              span, p, h1, h2, h3, h4, h5, h6, a, button {
                color: inherit !important;
                visibility: visible !important;
                opacity: 1 !important;
              }

              /* Garantir que links de navegação sejam visíveis */
              nav a {
                display: inline-block !important;
                visibility: visible !important;
                opacity: 1 !important;
              }
            `
            // Inserir no INÍCIO do head para ter máxima prioridade
            iframeDoc.head.insertBefore(resetStyle, iframeDoc.head.firstChild)
          } else {
            // Fallback: aplicar no elemento do frame se não for iframe
            frameElement.style.fontFamily = 'var(--font-body, "Montserrat", system-ui, sans-serif)'
            frameElement.style.backgroundColor = 'hsl(var(--background, 0 0% 100%))'
            frameElement.style.color = 'hsl(var(--foreground, 0 0% 12%))'
            frameElement.style.margin = '0'
            frameElement.style.width = '100%'
            frameElement.style.minHeight = '100%'
            
            // Copiar variáveis CSS
            const root = document.documentElement
            const computedStyle = getComputedStyle(root)
            const cssVariables = [
              '--background', '--foreground', '--card', '--card-foreground',
              '--popover', '--popover-foreground', '--primary', '--primary-foreground',
              '--secondary', '--secondary-foreground', '--muted', '--muted-foreground',
              '--accent', '--accent-foreground', '--destructive', '--destructive-foreground',
              '--border', '--input', '--ring', '--radius',
              '--gold', '--gold-light', '--wine', '--wine-dark', '--wine-light',
              '--cream', '--beige', '--charcoal',
              '--shadow-soft', '--shadow-elevated', '--shadow-gold',
              '--font-display', '--font-body', '--font-sans'
            ]
            
            cssVariables.forEach(variable => {
              const value = computedStyle.getPropertyValue(variable).trim()
              if (value) {
                frameElement.style.setProperty(variable, value)
              }
            })
          }
        } catch (error) {
          // Se houver erro de CORS ou similar, usar fallback
          console.warn('Could not access iframe document:', error)
        }
      }
    }

    // Aplicar imediatamente
    applyFrameStyles()

    // Aplicar novamente após delays para garantir que o frame foi renderizado
    // E que o CSS foi carregado
    const timeout1 = setTimeout(applyFrameStyles, 100)
    const timeout2 = setTimeout(applyFrameStyles, 500)
    const timeout3 = setTimeout(applyFrameStyles, 1000)
    const timeout4 = setTimeout(applyFrameStyles, 2000) // Aguardar CSS carregar
    
    return () => {
      clearTimeout(timeout1)
      clearTimeout(timeout2)
      clearTimeout(timeout3)
      clearTimeout(timeout4)
    }
  }, [previewMode]) // Re-executar quando o preview mode mudar

  useEffect(() => {
    // Desabilitar drag & drop via CSS e eventos
    const frameElement = frameRef.current?.querySelector('[data-craftjs-frame]') || frameRef.current
    
    if (!frameElement) return

    // Adicionar CSS para desabilitar pointer events em elementos draggable
    const style = document.createElement('style')
    style.textContent = `
      [data-craftjs-frame] * {
        user-select: none !important;
      }
      [data-craftjs-frame] [draggable="true"] {
        cursor: default !important;
        pointer-events: none !important;
      }
      [data-craftjs-frame] .craftjs-layer {
        pointer-events: none !important;
      }
      [data-craftjs-frame] .craftjs-layer > * {
        pointer-events: auto !important;
      }
    `
    document.head.appendChild(style)

    // Interceptar eventos de drag
    const handleDragStart = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      e.stopImmediatePropagation()
      return false
    }

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      return false
    }

    const handleDrop = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      e.stopImmediatePropagation()
      return false
    }

    // Adicionar listeners em todos os elementos dentro do frame
    const addListeners = (element: Element) => {
      element.addEventListener('dragstart', handleDragStart, true)
      element.addEventListener('dragover', handleDragOver, true)
      element.addEventListener('drop', handleDrop, true)
      
      // Remover atributo draggable
      if (element instanceof HTMLElement) {
        element.draggable = false
      }
      
      // Aplicar recursivamente nos filhos
      Array.from(element.children).forEach(child => addListeners(child))
    }

    if (frameElement) {
      addListeners(frameElement)
    }

    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style)
      }
      if (frameElement) {
        frameElement.removeEventListener('dragstart', handleDragStart, true)
        frameElement.removeEventListener('dragover', handleDragOver, true)
        frameElement.removeEventListener('drop', handleDrop, true)
      }
    }
  }, [previewMode]) // Re-executar quando o preview mode mudar

  return (
    <>
      <TemplateStyles />
      <div 
        ref={frameRef} 
        className="preview-wrapper min-h-screen"
        style={{
          fontFamily: 'var(--font-body, "Montserrat", system-ui, sans-serif)',
          backgroundColor: 'hsl(var(--background, 0 0% 100%))',
          color: 'hsl(var(--foreground, 0 0% 12%))',
          isolation: 'isolate', // Isolar do contexto de empilhamento do admin
        }}
      >
        <Frame data={safeData} />
      </div>
    </>
  )
}
