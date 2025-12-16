'use client'

/**
 * Componente de Isolamento de Estilos no Preview
 * 
 * Injeta estilos do template no iframe do Craft.js, garantindo isolamento completo
 * do CSS do admin, Tailwind e outras bibliotecas.
 * 
 * Este componente deve ser usado dentro do RestrictedFrame para garantir que
 * o iframe carregue APENAS os estilos do template.
 */

import { useEffect, useRef } from 'react'
import { loadTemplateStylesInIframe } from '@/lib/templates/template-styles-loader'

interface IsolatedPreviewStylesProps {
  templateId: string
  iframeElement: HTMLIFrameElement | null
}

/**
 * Hook para injetar estilos isolados no iframe
 */
export function useIsolatedPreviewStyles(
  templateId: string,
  iframeElement: HTMLIFrameElement | null
) {
  const stylesLoadedRef = useRef(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!iframeElement) return

    const applyStyles = async () => {
      try {
        const iframeDoc = iframeElement.contentDocument || iframeElement.contentWindow?.document
        
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/82e2bda5-de42-49f5-a3db-2e7cfbf454f0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'isolated-preview-styles.tsx:34',message:'applyStyles ENTRY',data:{hasIframeDoc:!!iframeDoc,readyState:iframeDoc?.readyState},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        
        if (!iframeDoc) {
          return
        }

        // Aplicar estilos (a função já lida com remoção de CSS do admin)
        await loadTemplateStylesInIframe(iframeDoc, templateId)
        stylesLoadedRef.current = true
        
        // #region agent log
        const finalBodyFont = iframeDoc.body ? getComputedStyle(iframeDoc.body).fontFamily : 'N/A';
        const finalLinks = Array.from(iframeDoc.querySelectorAll('link[rel="stylesheet"]')).map(l => l.getAttribute('href'));
        fetch('http://127.0.0.1:7243/ingest/82e2bda5-de42-49f5-a3db-2e7cfbf454f0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'isolated-preview-styles.tsx:43',message:'applyStyles SUCCESS',data:{finalBodyFont,finalLinks},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
      } catch (error) {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/82e2bda5-de42-49f5-a3db-2e7cfbf454f0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'isolated-preview-styles.tsx:46',message:'applyStyles ERROR',data:{error:String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        console.error('[IsolatedPreviewStyles] Erro ao aplicar estilos:', error)
      }
    }

    // Função para tentar aplicar estilos quando o iframe estiver pronto
    const tryApplyStyles = () => {
      const iframeDoc = iframeElement.contentDocument || iframeElement.contentWindow?.document
      
      if (iframeDoc && iframeDoc.readyState !== 'loading') {
        applyStyles()
        
        // Aplicar novamente após delays para garantir que não seja sobrescrito
        setTimeout(applyStyles, 200)
        setTimeout(applyStyles, 500)
        setTimeout(applyStyles, 1000)
        
        // Configurar intervalo para reaplicar estilos periodicamente (caso o Craft.js injete novos)
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
        }
        
        intervalRef.current = setInterval(() => {
          const doc = iframeElement.contentDocument || iframeElement.contentWindow?.document
          if (doc) {
            applyStyles()
          }
        }, 2000) // Reaplicar a cada 2 segundos
      }
    }

    // Aguardar iframe carregar
    const handleLoad = () => {
      setTimeout(tryApplyStyles, 50)
    }

    // Tentar aplicar imediatamente se o iframe já estiver pronto
    if (iframeElement.contentDocument?.readyState === 'complete') {
      tryApplyStyles()
    } else {
      iframeElement.addEventListener('load', handleLoad)
    }

    // Tentar aplicar após pequenos delays
    const timeout1 = setTimeout(tryApplyStyles, 100)
    const timeout2 = setTimeout(tryApplyStyles, 500)
    const timeout3 = setTimeout(tryApplyStyles, 1000)

    return () => {
      iframeElement.removeEventListener('load', handleLoad)
      clearTimeout(timeout1)
      clearTimeout(timeout2)
      clearTimeout(timeout3)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      stylesLoadedRef.current = false
    }
  }, [templateId, iframeElement])
}

/**
 * Componente que injeta estilos isolados no iframe
 * 
 * Este componente deve ser usado dentro do RestrictedFrame
 */
export function IsolatedPreviewStyles({ templateId, iframeElement }: IsolatedPreviewStylesProps) {
  useIsolatedPreviewStyles(templateId, iframeElement)
  return null
}

