'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { usePreviewMode, PREVIEW_DIMENSIONS } from './preview-context'

interface IsolatedPreviewFrameProps {
  templateId: string
  layoutJson: string | null
  onReady?: () => void
  onLayoutSerialize?: (serialized: string) => void
  onLayoutApplied?: () => void
}

/**
 * Componente que renderiza um iframe isolado apontando para /preview no app web.
 * Garante isolamento completo de CSS, JavaScript e DOM do editor.
 */
export function IsolatedPreviewFrame({ 
  templateId, 
  layoutJson,
  onReady,
  onLayoutSerialize,
  onLayoutApplied
}: IsolatedPreviewFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [isReady, setIsReady] = useState(false)
  const [layoutApplied, setLayoutApplied] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const { previewMode, dimensions } = usePreviewMode()

  // Obter URL do app web
  const getWebUrl = useCallback(() => {
    if (typeof window === 'undefined') return 'http://localhost:3000'
    
    // Se estiver em localhost, usar porta 3000 para web
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return `http://${window.location.hostname}:3000`
    }
    
    // Em produção, substituir 'admin' por 'web' no domínio
    return window.location.origin.replace('admin', 'web')
  }, [])

  // Construir URL do preview com query params
  const getPreviewUrl = useCallback(() => {
    const baseUrl = getWebUrl()
    const params = new URLSearchParams({
      template: templateId,
      mode: previewMode,
      editable: 'true', // Indica que deve ser editável com Craft.js
    })
    
    // SEMPRE enviar layout via postMessage para garantir que seja aplicado antes de mostrar
    // Não enviar via query param para evitar flash do template padrão
    // O preview carregará sem layout e aguardará o postMessage
    
    return `${baseUrl}/preview?${params.toString()}`
  }, [templateId, previewMode, getWebUrl])

  // Função para enviar mensagens ao iframe
  const sendToIframe = useCallback((action: string, data: Record<string, unknown>) => {
    if (!iframeRef.current?.contentWindow) {
      console.warn('[IsolatedPreviewFrame] Tentando enviar mensagem mas iframe não está disponível:', action)
      return
    }
    
    if (!isReady) {
      console.warn('[IsolatedPreviewFrame] Tentando enviar mensagem mas iframe não está pronto:', action)
      return
    }

    const webUrl = getWebUrl()
    console.log('[IsolatedPreviewFrame] Enviando mensagem para iframe:', action, { webUrl })
    
    iframeRef.current.contentWindow.postMessage(
      { action, ...data },
      webUrl
    )
    
    // Também tentar enviar com '*' como fallback se não funcionar
    // Isso ajuda quando há problemas de CORS ou origem
    setTimeout(() => {
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage(
          { action, ...data },
          '*'
        )
      }
    }, 100)
  }, [isReady, getWebUrl])

  // Aguardar iframe estar pronto
  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return

    // Limpar timeout anterior se existir
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    // Timeout de segurança: se após 10 segundos não recebermos LAYOUT_APPLIED, 
    // assumimos que o layout foi aplicado para evitar loading infinito
    // Reduzir para 5 segundos para resposta mais rápida
    timeoutRef.current = setTimeout(() => {
      setLayoutApplied((prev) => {
        if (!prev && isReady && layoutJson) {
          console.warn('[IsolatedPreviewFrame] Timeout (5s): assumindo que layout foi aplicado')
          onLayoutApplied?.()
          return true
        }
        return prev
      })
    }, 5000)

    const handleLoad = () => {
      // Usar requestAnimationFrame para garantir que o iframe está pronto
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsReady(true)
          onReady?.()
          
          // SEMPRE enviar layout via postMessage para garantir que seja aplicado antes de mostrar
          // Isso evita o flash do template padrão
          if (layoutJson) {
            console.log('[IsolatedPreviewFrame] Enviando layout para iframe após load')
            sendToIframe('UPDATE_LAYOUT', { layout: layoutJson })
          }
        })
      })
    }

    const handleMessage = (event: MessageEvent) => {
      // Verificar origem para segurança (aceitar do web app, localhost e vercel.app)
      const webUrl = getWebUrl()
      let isValidOrigin = false
      
      try {
        const webUrlObj = new URL(webUrl)
        isValidOrigin = event.origin.includes(webUrlObj.hostname) || 
                       event.origin.includes('vercel.app') ||
                       event.origin.includes('localhost') || 
                       event.origin.includes('127.0.0.1')
      } catch {
        // Se não conseguir fazer parse da URL, aceitar se for localhost ou vercel.app
        isValidOrigin = event.origin.includes('localhost') || 
                       event.origin.includes('127.0.0.1') ||
                       event.origin.includes('vercel.app')
      }

      if (!isValidOrigin) {
        console.log('[IsolatedPreviewFrame] Mensagem rejeitada de origem:', event.origin)
        return
      }

      console.log('[IsolatedPreviewFrame] Mensagem recebida:', event.data.action, { origin: event.origin })

      if (event.data.action === 'PREVIEW_READY') {
        console.log('[IsolatedPreviewFrame] Preview pronto recebido')
        setIsReady(true)
        onReady?.()
        
        // Enviar layout imediatamente quando preview estiver pronto
        if (layoutJson) {
          console.log('[IsolatedPreviewFrame] Preview pronto, enviando layout')
          sendToIframe('UPDATE_LAYOUT', { layout: layoutJson })
        }
      }
      
      // Confirmar que o layout foi aplicado no iframe
      if (event.data.action === 'LAYOUT_APPLIED') {
        console.log('[IsolatedPreviewFrame] Layout aplicado no iframe (confirmado)')
        // Limpar timeout já que recebemos a confirmação
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
          timeoutRef.current = null
        }
        if (!layoutApplied) {
          setLayoutApplied(true)
          // Chamar callback imediatamente quando layout for aplicado
          if (onLayoutApplied) {
            console.log('[IsolatedPreviewFrame] Chamando onLayoutApplied')
            onLayoutApplied()
          }
        }
      }
      
      // Receber layout serializado do iframe
      if (event.data.action === 'LAYOUT_SERIALIZED' && event.data.layout) {
        console.log('[IsolatedPreviewFrame] Recebendo layout serializado do iframe')
        onLayoutSerialize?.(event.data.layout)
      }
    }

    iframe.addEventListener('load', handleLoad)
    window.addEventListener('message', handleMessage)

    return () => {
      iframe.removeEventListener('load', handleLoad)
      window.removeEventListener('message', handleMessage)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [onReady, sendToIframe, layoutJson, getWebUrl, layoutApplied, isReady, onLayoutApplied])

  // Enviar layout quando iframe estiver pronto
  useEffect(() => {
    if (!isReady || !layoutJson) return
    
    // Resetar timeout e flag quando layout mudar
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    setLayoutApplied(false)
    
    // Sempre enviar via postMessage para garantir que o layout correto seja aplicado
    // Isso evita que o template padrão seja mostrado primeiro
    console.log('[IsolatedPreviewFrame] Enviando layout para iframe')
    sendToIframe('UPDATE_LAYOUT', { layout: layoutJson })
    
    // Criar novo timeout para este layout
    // Usar uma função que verifica o estado atual dentro do timeout
    // Reduzir para 5 segundos para resposta mais rápida
    timeoutRef.current = setTimeout(() => {
      setLayoutApplied((prev) => {
        if (!prev) {
          console.warn('[IsolatedPreviewFrame] Timeout (5s) após mudança de layout: assumindo aplicado')
          onLayoutApplied?.()
          return true
        }
        return prev
      })
    }, 5000)
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [layoutJson, isReady, sendToIframe, onLayoutApplied])
  
  // Função para solicitar serialização do layout do iframe
  const requestLayoutSerialize = useCallback(() => {
    if (!isReady) {
      console.warn('[IsolatedPreviewFrame] Iframe não está pronto para serializar')
      return
    }
    console.log('[IsolatedPreviewFrame] Solicitando serialização do layout do iframe')
    sendToIframe('REQUEST_LAYOUT_SERIALIZE', {})
  }, [isReady, sendToIframe])
  
  // Expor função para o componente pai
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__requestLayoutSerialize = requestLayoutSerialize
    }
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).__requestLayoutSerialize
      }
    }
  }, [requestLayoutSerialize])

  // Atualizar dimensões do iframe quando previewMode mudar
  useEffect(() => {
    if (!iframeRef.current) return
    
    const iframe = iframeRef.current
    const { width, height } = dimensions
    
    // Ajustar dimensões do container do iframe
    iframe.style.width = `${width}px`
    iframe.style.height = `${height}px`
    iframe.style.maxWidth = '100%'
    iframe.style.maxHeight = '100%'
    
    // Notificar iframe sobre mudança de viewport
    if (isReady) {
      sendToIframe('UPDATE_VIEWPORT', { mode: previewMode, width, height })
    }
  }, [previewMode, dimensions, isReady, sendToIframe])

  const previewUrl = getPreviewUrl()

  // Não mostrar o iframe até que o layout tenha sido aplicado
  // Isso evita o flash do template padrão
  // MAS sempre renderizar o iframe (mesmo invisível) para receber mensagens
  // Se não tiver layoutJson, sempre mostrar loading
  const shouldShowIframe = layoutJson && isReady && layoutApplied

  return (
    <div className="w-full h-full flex items-center justify-center bg-surface-2 overflow-auto relative">
      {/* Loading enquanto preview não está pronto */}
      {!shouldShowIframe && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-text-secondary">Carregando preview...</p>
          </div>
        </div>
      )}
      
      <div 
        className="flex-shrink-0 transition-all duration-300"
        style={{
          width: `${dimensions.width}px`,
          height: `${dimensions.height}px`,
          maxWidth: '100%',
          maxHeight: '100%',
          opacity: shouldShowIframe ? 1 : 0,
          pointerEvents: shouldShowIframe ? 'auto' : 'none',
        }}
      >
        <iframe
          ref={iframeRef}
          src={previewUrl}
          className="w-full h-full border-0 shadow-lg"
          title="Preview"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation allow-modals"
          style={{
            width: `${dimensions.width}px`,
            height: `${dimensions.height}px`,
          }}
        />
      </div>
    </div>
  )
}

