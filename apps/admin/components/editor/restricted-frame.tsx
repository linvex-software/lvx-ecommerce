'use client'

/**
 * Frame Restrito
 * 
 * Wrapper do Frame do Craft.js que desabilita drag & drop e adicionar/remover componentes
 * Aplica isolamento completo de estilos, carregando APENAS os estilos do template no iframe
 */

import { Frame } from '@craftjs/core'
import { useEffect, useRef, useState } from 'react'
import { usePreviewMode } from './preview-context'
import { useIsolatedPreviewStyles } from './isolated-preview-styles'

interface RestrictedFrameProps {
  data?: string | null
  templateId?: string
}

export function RestrictedFrame({ data, templateId = 'flor-de-menina' }: RestrictedFrameProps) {
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

  // Obter referência ao iframe do Craft.js para aplicar isolamento de estilos
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const [iframeElement, setIframeElement] = useState<HTMLIFrameElement | null>(null)

  // Aplicar isolamento de estilos no iframe usando o novo sistema
  useEffect(() => {
    const applyIsolation = () => {
      const frameElement = frameRef.current?.querySelector('[data-craftjs-frame]') as HTMLIFrameElement | null
      
      if (frameElement && frameElement !== iframeRef.current) {
        iframeRef.current = frameElement
        setIframeElement(frameElement)
        
        try {
          const iframeDoc = frameElement.contentDocument || frameElement.contentWindow?.document
          
          if (iframeDoc) {
            // Configurar viewport baseado no preview mode
            let viewportMeta = iframeDoc.querySelector('meta[name="viewport"]')
            const viewportWidth = previewMode === 'tablet' ? '768' : 'device-width'
            
            if (!viewportMeta) {
              viewportMeta = iframeDoc.createElement('meta')
              viewportMeta.setAttribute('name', 'viewport')
              viewportMeta.setAttribute('content', `width=${viewportWidth}, initial-scale=1.0, user-scalable=no`)
              iframeDoc.head.insertBefore(viewportMeta, iframeDoc.head.firstChild)
            } else {
              viewportMeta.setAttribute('content', `width=${viewportWidth}, initial-scale=1.0, user-scalable=no`)
            }

            // Aplicar estilos básicos no body
            iframeDoc.body.style.margin = '0'
            iframeDoc.body.style.padding = '0'
          }
        } catch (error) {
          console.warn('[RestrictedFrame] Erro ao acessar documento do iframe:', error)
        }
      }
    }

    // Aplicar isolamento quando o iframe estiver pronto
    const timeout1 = setTimeout(applyIsolation, 100)
    const timeout2 = setTimeout(applyIsolation, 500)
    const timeout3 = setTimeout(applyIsolation, 1000)
    
    return () => {
      clearTimeout(timeout1)
      clearTimeout(timeout2)
      clearTimeout(timeout3)
    }
  }, [templateId, previewMode])

  // Usar hook de isolamento de estilos
  useIsolatedPreviewStyles(templateId, iframeElement)

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
    <div 
      ref={frameRef} 
      className="preview-wrapper min-h-screen"
      style={{
        isolation: 'isolate', // Isolar do contexto de empilhamento do admin
      }}
    >
      <Frame data={safeData} />
    </div>
  )
}
