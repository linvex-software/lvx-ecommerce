'use client'

import { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react'
import type { Block } from '@/components/blocks/types'
import type { NavbarItem } from '@/lib/types/navbar'

interface SelectedElement {
  id: string
  tag: string
  props: Record<string, unknown>
  styles: Record<string, string>
  bounds: {
    top: number
    left: number
    width: number
    height: number
  }
}

interface PreviewFrameProps {
  blocks: Block[]
  navbarItems?: NavbarItem[]
  theme?: {
    primaryColor?: string
    secondaryColor?: string
    backgroundColor?: string
    foregroundColor?: string
    fontFamily?: string
    borderRadius?: string
  }
  previewUrl?: string
  onElementSelect?: (element: SelectedElement) => void
  elementSelectorEnabled?: boolean
}

export const PreviewFrame = forwardRef<
  { updateElementStyle: (elementId: string, property: string, value: string) => void },
  PreviewFrameProps
>(({ 
  blocks, 
  navbarItems, 
  theme, 
  previewUrl,
  onElementSelect,
  elementSelectorEnabled = false
}, ref) => {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [isReady, setIsReady] = useState(false)

  // Função para enviar mensagens ao iframe
  const sendToIframe = (action: string, data: Record<string, unknown>) => {
    if (!iframeRef.current?.contentWindow || !isReady) return

    iframeRef.current.contentWindow.postMessage(
      { action, ...data },
      '*'
    )
  }

  // Aguardar iframe estar pronto
  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return

    const handleLoad = () => {
      // Pequeno delay para garantir que o iframe está pronto
      setTimeout(() => {
        setIsReady(true)
      }, 200)
    }

    const handleMessage = (event: MessageEvent) => {
      if (event.data.action === 'PREVIEW_READY') {
        setIsReady(true)
      }
    }

    iframe.addEventListener('load', handleLoad)
    window.addEventListener('message', handleMessage)

    return () => {
      iframe.removeEventListener('load', handleLoad)
      window.removeEventListener('message', handleMessage)
    }
  }, [])

  // Enviar atualizações de layout
  useEffect(() => {
    if (!isReady) return
    sendToIframe('UPDATE_LAYOUT', { layout: blocks } as Record<string, unknown>)
  }, [blocks, isReady])

  // Enviar atualizações de navbar
  useEffect(() => {
    if (!isReady || !navbarItems) return
    sendToIframe('UPDATE_NAVBAR', { navbar: navbarItems } as Record<string, unknown>)
  }, [navbarItems, isReady])

  // Enviar atualizações de tema
  useEffect(() => {
    if (!isReady || !theme) return
    sendToIframe('UPDATE_THEME', { theme } as Record<string, unknown>)
  }, [theme, isReady])

  // Ativar/desativar seletor de elementos
  useEffect(() => {
    if (!isReady) {
      console.log('[PreviewFrame] Not ready yet, waiting...')
      return
    }
    console.log('[PreviewFrame] Sending element selector state:', elementSelectorEnabled)
    if (elementSelectorEnabled) {
      sendToIframe('ENABLE_ELEMENT_SELECTOR', {})
    } else {
      sendToIframe('DISABLE_ELEMENT_SELECTOR', {})
    }
  }, [elementSelectorEnabled, isReady])

  // Escutar mensagens do iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      console.log('[PreviewFrame] Received message:', event.data)
      if (event.data.action === 'SELECTED_ELEMENT') {
        console.log('[PreviewFrame] Element selected:', event.data)
        onElementSelect?.(event.data as SelectedElement)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [onElementSelect])

  // Função para atualizar estilo de elemento
  const updateElementStyle = useCallback((elementId: string, property: string, value: string) => {
    if (!isReady) return
    sendToIframe('UPDATE_ELEMENT_STYLE', { elementId, property, value })
  }, [isReady])

  // Expor função via ref
  useImperativeHandle(ref, () => ({
    updateElementStyle
  }), [updateElementStyle])

  const getPreviewUrl = () => {
    if (previewUrl) return previewUrl
    
    if (typeof window === 'undefined') return 'http://localhost:3000'
    
    // Se estiver em localhost, usar porta 3000 para web
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return `http://${window.location.hostname}:3000`
    }
    
    // Em produção, substituir 'admin' por 'web' no domínio
    return window.location.origin.replace('admin', 'web')
  }
  
  const defaultPreviewUrl = getPreviewUrl()

  return (
    <div className="w-full h-full border border-border rounded-lg overflow-hidden bg-muted">
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10">
          <div className="text-sm text-muted-foreground">Carregando preview...</div>
        </div>
      )}
      <iframe
        ref={iframeRef}
        src={defaultPreviewUrl}
        className="w-full h-full"
        title="Preview"
        sandbox="allow-same-origin allow-scripts"
      />
    </div>
  )
})

PreviewFrame.displayName = 'PreviewFrame'
