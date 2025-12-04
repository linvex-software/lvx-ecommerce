'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useNode } from '@craftjs/core'
import type { Block } from '@/components/blocks/types'

interface CraftPreviewFrameProps {
  blocks: Block[]
  blockId: string
}

/**
 * Componente que renderiza um iframe com a página real do @web
 * para mostrar como o bloco aparecerá na produção
 */
export function CraftPreviewFrame({ blocks, blockId }: CraftPreviewFrameProps) {
  const { connectors: { connect, drag }, isSelected } = useNode((node) => ({
    isSelected: node.events.selected,
  }))
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [isReady, setIsReady] = useState(false)

  const getWebUrl = () => {
    if (typeof window === 'undefined') return 'http://localhost:3000'
    
    // Se estiver em localhost, usar porta 3000 para web
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return `http://${window.location.hostname}:3000`
    }
    
    // Em produção, substituir 'admin' por 'web' no domínio
    return window.location.origin.replace('admin', 'web')
  }

  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return

    const handleLoad = () => {
      setTimeout(() => {
        setIsReady(true)
        // Enviar blocos para o iframe
        if (iframe.contentWindow) {
          iframe.contentWindow.postMessage({
            action: 'UPDATE_LAYOUT',
            layout: blocks,
          }, '*')
        }
      }, 500)
    }

    iframe.addEventListener('load', handleLoad)
    return () => iframe.removeEventListener('load', handleLoad)
  }, [blocks])

  return (
    <div 
      ref={(ref: HTMLDivElement | null) => connect(drag(ref))}
      className={`relative w-full ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
      style={{ minHeight: '400px' }}
    >
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-sm text-gray-500">Carregando preview...</div>
        </div>
      )}
      <iframe
        ref={iframeRef}
        src={getWebUrl()}
        className="w-full h-full border-0"
        style={{ minHeight: '600px' }}
        sandbox="allow-same-origin allow-scripts"
      />
    </div>
  )
}










