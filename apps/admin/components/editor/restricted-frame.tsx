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

  // Aplicar estilos CSS diretamente no frame do Craft.js
  // O Craft.js renderiza diretamente no DOM (não usa iframe), então precisamos aplicar os estilos nos elementos do preview
  useEffect(() => {
    const applyFrameStyles = () => {
      // O Craft.js renderiza diretamente no DOM dentro de [data-craftjs-frame]
      const frameElement = frameRef.current?.querySelector('[data-craftjs-frame]') as HTMLElement | null
      
      if (!frameElement) return undefined
      
      try {
          // O Craft.js renderiza DIRETAMENTE no DOM (não usa iframe)
          // Aplicar estilos diretamente no elemento [data-craftjs-frame] e seus filhos
          
          // 1. Aplicar variáveis CSS no elemento frame
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

          // Aplicar variáveis CSS diretamente no frameElement
          Object.entries(templateVariables).forEach(([variable, value]) => {
            frameElement.style.setProperty(variable, value)
          })

          // 2. GARANTIR QUE GOOGLE FONTS ESTÁ CARREGADO NO DOCUMENTO PRINCIPAL
          // As fontes da loja vêm do Google Fonts - precisamos carregar no editor também
          const googleFontsUrl = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=Montserrat:wght@300;400;500;600;700&display=swap'
          
          let googleFontsLink = document.getElementById('template-google-fonts') as HTMLLinkElement | null
          if (!googleFontsLink) {
            googleFontsLink = document.createElement('link')
            googleFontsLink.id = 'template-google-fonts'
            googleFontsLink.href = googleFontsUrl
            googleFontsLink.rel = 'stylesheet'
            googleFontsLink.setAttribute('media', 'all')
            // Inserir no início do head para garantir carregamento antecipado
            document.head.insertBefore(googleFontsLink, document.head.firstChild)
          }

          // 3. Criar e inserir CSS de fontes ULTRA PRIORITÁRIO no head do documento principal
          // Isso garante que tenha prioridade sobre o CSS do admin
          let ultraPriorityStyle = document.getElementById('ultra-priority-template-fonts-frame')
          if (!ultraPriorityStyle) {
            ultraPriorityStyle = document.createElement('style')
            ultraPriorityStyle.id = 'ultra-priority-template-fonts-frame'
            document.head.appendChild(ultraPriorityStyle)
          }
          
          ultraPriorityStyle.textContent = `
            /* FORÇAR FONTES DO TEMPLATE NO FRAME DO CRAFT.JS */
            /* Prioridade ABSOLUTA sobre qualquer CSS do admin */
            /* Fontes: Cormorant Garamond (display) e Montserrat (body) do Google Fonts */
            
            /* Aplicar variáveis CSS no frame com EXATAMENTE as mesmas fontes da loja */
            [data-craftjs-frame] {
              --font-display: 'Cormorant Garamond', Georgia, serif !important;
              --font-body: 'Montserrat', system-ui, sans-serif !important;
              /* Garantir que font-display está configurado */
              font-display: swap !important;
            }
            
            /* FORÇAR fontes em TODOS os elementos dentro do frame */
            /* Body e elementos de texto usam Montserrat */
            [data-craftjs-frame],
            [data-craftjs-frame] body,
            [data-craftjs-frame] body *:not(h1):not(h2):not(h3):not(h4):not(h5):not(h6):not(.font-display):not(.font-display *) {
              font-family: var(--font-body, 'Montserrat', system-ui, sans-serif) !important;
              font-display: swap !important;
              font-weight: inherit !important;
              font-style: inherit !important;
            }
            
            /* TODOS os headings dentro do frame usam Cormorant Garamond */
            [data-craftjs-frame] h1,
            [data-craftjs-frame] h2,
            [data-craftjs-frame] h3,
            [data-craftjs-frame] h4,
            [data-craftjs-frame] h5,
            [data-craftjs-frame] h6,
            [data-craftjs-frame] h1 *,
            [data-craftjs-frame] h2 *,
            [data-craftjs-frame] h3 *,
            [data-craftjs-frame] h4 *,
            [data-craftjs-frame] h5 *,
            [data-craftjs-frame] h6 * {
              font-family: var(--font-display, 'Cormorant Garamond', Georgia, serif) !important;
              font-weight: 500 !important;
              font-style: normal !important;
              font-display: swap !important;
            }
            
            /* Classes do template - Cormorant Garamond */
            [data-craftjs-frame] .font-display,
            [data-craftjs-frame] .font-display * {
              font-family: var(--font-display, 'Cormorant Garamond', Georgia, serif) !important;
              font-display: swap !important;
            }
            
            /* Classes do template - Montserrat */
            [data-craftjs-frame] .font-body,
            [data-craftjs-frame] .font-body * {
              font-family: var(--font-body, 'Montserrat', system-ui, sans-serif) !important;
              font-display: swap !important;
            }
          `

          // 4. INTERCEPTAR TODAS as tentativas de definir font-family e forçar as fontes corretas
          // Usar EXATAMENTE as mesmas fontes que a loja (Google Fonts)
          const fontBody = 'Montserrat, system-ui, sans-serif'
          const fontDisplay = 'Cormorant Garamond, Georgia, serif'
          
          // Interceptar CSSStyleDeclaration.setProperty
          const originalSetProperty = CSSStyleDeclaration.prototype.setProperty
          const interceptedSetProperty = function(this: CSSStyleDeclaration, property: string, value: string, priority?: string) {
            if (property === 'font-family' || property === 'fontFamily') {
              const element = (this as any).ownerElement || (this as any).parentElement
              if (element && frameElement.contains(element)) {
                // Determinar qual fonte usar
                const tagName = element.tagName?.toUpperCase()
                const isHeading = tagName && /^H[1-6]$/.test(tagName)
                const isInHeading = element.closest && element.closest('h1, h2, h3, h4, h5, h6')
                const hasFontDisplay = element.classList?.contains('font-display')
                const hasFontBody = element.classList?.contains('font-body')
                
                if (isHeading || isInHeading || hasFontDisplay) {
                  return originalSetProperty.call(this, 'font-family', fontDisplay, 'important')
                } else if (hasFontBody) {
                  return originalSetProperty.call(this, 'font-family', fontBody, 'important')
                } else {
                  return originalSetProperty.call(this, 'font-family', fontBody, 'important')
                }
              }
            }
            return originalSetProperty.call(this, property, value, priority)
          }
          CSSStyleDeclaration.prototype.setProperty = interceptedSetProperty as any
          
          // Interceptar fontFamily setter
          const fontFamilyDescriptor = Object.getOwnPropertyDescriptor(CSSStyleDeclaration.prototype, 'fontFamily')
          Object.defineProperty(CSSStyleDeclaration.prototype, 'fontFamily', {
            set: function(value: string) {
              const element = (this as any).ownerElement || (this as any).parentElement
              if (element && frameElement.contains(element)) {
                const tagName = element.tagName?.toUpperCase()
                const isHeading = tagName && /^H[1-6]$/.test(tagName)
                const isInHeading = element.closest && element.closest('h1, h2, h3, h4, h5, h6')
                const hasFontDisplay = element.classList?.contains('font-display')
                const hasFontBody = element.classList?.contains('font-body')
                
                if (isHeading || isInHeading || hasFontDisplay) {
                  return this.setProperty('font-family', fontDisplay, 'important')
                } else if (hasFontBody) {
                  return this.setProperty('font-family', fontBody, 'important')
                } else {
                  return this.setProperty('font-family', fontBody, 'important')
                }
              }
              if (fontFamilyDescriptor && fontFamilyDescriptor.set) {
                fontFamilyDescriptor.set.call(this, value)
              }
            },
            get: function() {
              return this.getPropertyValue('font-family')
            },
            configurable: true
          })

          // Função ULTRA AGRESSIVA para forçar fontes em TODOS os elementos
          const forceFonts = () => {
            // Forçar font-body no frame element
            frameElement.style.setProperty('font-family', fontBody, 'important')
            
            // Pegar TODOS os elementos dentro do frame (incluindo SVG, etc)
            const allElements = frameElement.querySelectorAll('*')
            
            allElements.forEach((el) => {
              if (!(el instanceof HTMLElement)) return
              
              const tagName = el.tagName?.toUpperCase()
              const isHeading = tagName && /^H[1-6]$/.test(tagName)
              const isInHeading = el.closest('h1, h2, h3, h4, h5, h6')
              const hasFontDisplay = el.classList.contains('font-display')
              const hasFontBody = el.classList.contains('font-body')
              
              // Forçar font-display em headings
              if (isHeading || isInHeading || hasFontDisplay) {
                el.style.setProperty('font-family', fontDisplay, 'important')
                // Forçar também via computedStyle
                const computed = window.getComputedStyle(el)
                if (computed.fontFamily !== fontDisplay) {
                  el.style.setProperty('font-family', fontDisplay, 'important')
                }
              } 
              // Forçar font-body em tudo mais
              else if (!hasFontDisplay) {
                el.style.setProperty('font-family', fontBody, 'important')
                const computed = window.getComputedStyle(el)
                if (computed.fontFamily !== fontBody && !computed.fontFamily.includes('Cormorant')) {
                  el.style.setProperty('font-family', fontBody, 'important')
                }
              }
            })
            
            // Garantir que classes específicas funcionem
            frameElement.querySelectorAll('.font-display, [class*="font-display"]').forEach((el) => {
              if (el instanceof HTMLElement) {
                el.style.setProperty('font-family', fontDisplay, 'important')
              }
            })
            
            frameElement.querySelectorAll('.font-body, [class*="font-body"]').forEach((el) => {
              if (el instanceof HTMLElement) {
                el.style.setProperty('font-family', fontBody, 'important')
              }
            })
          }
          
          // Executar múltiplas vezes para garantir
          forceFonts()
          requestAnimationFrame(forceFonts)
          requestAnimationFrame(() => requestAnimationFrame(forceFonts))
          
          // 4. Observar mudanças no DOM do frame e reaplicar fontes IMEDIATAMENTE
          const observer = new MutationObserver(() => {
            // Executar múltiplas vezes para pegar elementos renderizados pelo React
            forceFonts()
            requestAnimationFrame(forceFonts)
            setTimeout(forceFonts, 0)
            setTimeout(forceFonts, 10)
          })
          
          observer.observe(frameElement, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['style', 'class', 'id']
          })
          
          // Reaplicar AGressivamente e frequentemente
          const intervalId = setInterval(() => {
            forceFonts()
          }, 100) // A cada 100ms!
          
          // Também usar requestAnimationFrame para garantir
          let rafId: number | null = null
          const rafLoop = () => {
            forceFonts()
            rafId = requestAnimationFrame(rafLoop)
          }
          rafId = requestAnimationFrame(rafLoop)
          
          // Retornar função de cleanup
          return () => {
            observer.disconnect()
            clearInterval(intervalId)
            if (rafId !== null) {
              cancelAnimationFrame(rafId)
            }
            // Restaurar métodos originais
            CSSStyleDeclaration.prototype.setProperty = originalSetProperty
            if (fontFamilyDescriptor) {
              Object.defineProperty(CSSStyleDeclaration.prototype, 'fontFamily', fontFamilyDescriptor)
            }
          }
        } catch (error) {
          // Se houver erro, logar mas continuar
          console.warn('[RestrictedFrame] Erro ao aplicar estilos:', error)
          return undefined
        }
    }

    // Armazenar e aplicar cleanup function
    let cleanupFn: (() => void) | undefined = applyFrameStyles()

    // Aplicar novamente após delays para garantir que o frame foi renderizado
    const timeout1 = setTimeout(() => {
      if (cleanupFn) cleanupFn()
      cleanupFn = applyFrameStyles()
    }, 100)
    const timeout2 = setTimeout(() => {
      if (cleanupFn) cleanupFn()
      cleanupFn = applyFrameStyles()
    }, 500)
    const timeout3 = setTimeout(() => {
      if (cleanupFn) cleanupFn()
      cleanupFn = applyFrameStyles()
    }, 1000)
    const timeout4 = setTimeout(() => {
      if (cleanupFn) cleanupFn()
      cleanupFn = applyFrameStyles()
    }, 2000)
    
    return () => {
      clearTimeout(timeout1)
      clearTimeout(timeout2)
      clearTimeout(timeout3)
      clearTimeout(timeout4)
      if (cleanupFn) cleanupFn()
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
