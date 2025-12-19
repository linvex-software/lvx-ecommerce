'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { TemplateLayoutRenderer } from '@/lib/templates/template-layout-renderer'
import { loadAllTemplateStyles } from '@/lib/templates/template-styles-loader'
import { loadTemplateComponents } from '@/lib/templates/template-loader'
import { EditablePreview } from './editable-preview'

function PreviewContent() {
  const searchParams = useSearchParams()
  const templateId = searchParams.get('template') || 'flor-de-menina'
  const layoutParam = searchParams.get('layout')
  const mode = searchParams.get('mode') || 'desktop'
  const isEditable = searchParams.get('editable') === 'true'
  const [isStylesLoaded, setIsStylesLoaded] = useState(false)
  const [layoutJson, setLayoutJson] = useState<string | null>(layoutParam || null)
  const [resolver, setResolver] = useState<Record<string, any>>({})
  const [isResolverLoaded, setIsResolverLoaded] = useState(false)

  // Carregar estilos do template
  useEffect(() => {
    loadAllTemplateStyles(templateId)
      .then(() => {
        setIsStylesLoaded(true)
      })
      .catch((error) => {
        console.error('Error loading template styles:', error)
        // Continuar mesmo se houver erro
        setIsStylesLoaded(true)
      })
  }, [templateId])

  // Carregar resolver de componentes se for editável
  useEffect(() => {
    if (!isEditable) {
      setIsResolverLoaded(true)
      return
    }

    loadTemplateComponents(templateId)
      .then((componentResolver) => {
        setResolver(componentResolver)
        setIsResolverLoaded(true)
      })
      .catch((error) => {
        console.error('Error loading template components:', error)
        setIsResolverLoaded(true)
      })
  }, [templateId, isEditable])

  // Escutar mensagens do editor para atualizações em tempo real
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Verificar origem para segurança (aceitar do admin)
      const origin = event.origin
      const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1')
      const isAdminOrigin = origin.includes('admin') || isLocalhost

      if (!isAdminOrigin) return

      if (event.data.action === 'UPDATE_LAYOUT') {
        const layout = event.data.layout
        if (typeof layout === 'string') {
          setLayoutJson(layout)
          // Forçar re-render do TemplateLayoutRenderer ou EditablePreview
          window.dispatchEvent(new CustomEvent('layout-updated', { detail: layout }))
        }
      }

      if (event.data.action === 'UPDATE_VIEWPORT') {
        // Atualizar viewport meta tag se necessário
        const { width } = event.data
        if (width && typeof document !== 'undefined') {
          let viewportMeta = document.querySelector('meta[name="viewport"]')
          if (!viewportMeta) {
            viewportMeta = document.createElement('meta')
            viewportMeta.setAttribute('name', 'viewport')
            document.head.appendChild(viewportMeta)
          }
          viewportMeta.setAttribute('content', `width=${width}, initial-scale=1.0, user-scalable=no`)
        }
      }
    }

    window.addEventListener('message', handleMessage)

    // Notificar editor que preview está pronto
    const notifyReady = () => {
      if (window.parent) {
        window.parent.postMessage({ action: 'PREVIEW_READY' }, '*')
      }
    }

    // Aguardar um pouco antes de notificar
    const timer = setTimeout(notifyReady, 500)

    return () => {
      window.removeEventListener('message', handleMessage)
      clearTimeout(timer)
    }
  }, [])

  // Aplicar viewport baseado no mode
  useEffect(() => {
    if (typeof document === 'undefined') return

    const viewportWidths: Record<string, string> = {
      desktop: '1920',
      tablet: '768',
      mobile: '375',
    }

    const width = viewportWidths[mode] || '1920'
    let viewportMeta = document.querySelector('meta[name="viewport"]')
    
    if (!viewportMeta) {
      viewportMeta = document.createElement('meta')
      viewportMeta.setAttribute('name', 'viewport')
      document.head.appendChild(viewportMeta)
    }
    
    viewportMeta.setAttribute('content', `width=${width}, initial-scale=1.0, user-scalable=no`)
  }, [mode])

  if (!isStylesLoaded || !isResolverLoaded) {
    return null
  }

  // Se for editável, usar Craft.js Editor + Frame
  if (isEditable && Object.keys(resolver).length > 0) {
    return (
      <EditablePreview 
        templateId={templateId}
        resolver={resolver}
        initialLayoutJson={layoutJson}
        onLayoutChange={(newLayout) => {
          // Notificar editor sobre mudanças no layout
          if (window.parent) {
            window.parent.postMessage({
              action: 'LAYOUT_CHANGED',
              layout: newLayout
            }, '*')
          }
        }}
      />
    )
  }

  // Se não for editável, usar TemplateLayoutRenderer (modo preview normal)
  return (
    <div className="min-h-screen w-full">
      <TemplateLayoutRenderer 
        templateId={templateId} 
        initialLayoutJson={layoutJson}
      />
    </div>
  )
}

export default function PreviewPage() {
  return (
    <Suspense
      fallback={null}
    >
      <PreviewContent />
    </Suspense>
  )
}

