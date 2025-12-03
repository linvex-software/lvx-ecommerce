'use client'

import { Suspense, useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { Editor, Frame, Element, useEditor } from '@craftjs/core'
import { useAuthStore } from '@/store/auth-store'
import { apiClient } from '@/lib/api-client'
import { EditorToolbox } from '@/components/editor/editor-toolbox'
import { EditorSettingsPanel } from '@/components/editor/editor-settings-panel'
import { EditorTopbar } from '@/components/editor/editor-topbar'
import { PreviewProvider, usePreviewMode } from '@/components/editor/preview-context'
import { ThemeProvider } from '@/components/theme/theme-provider'
import {
  Hero,
  Banner,
  ProductGrid,
  Newsletter,
  Testimonials,
  FAQ,
  FooterSection,
  Categories,
  ProdutosBentoGrid,
  Navbar
} from '@/components/store'

const resolver = {
  Hero,
  Banner,
  ProductGrid,
  Newsletter,
  Testimonials,
  FAQ,
  FooterSection,
  Categories,
  ProdutosBentoGrid,
  Navbar
}

function EditorContent() {
  const searchParams = useSearchParams()
  const isPreview = searchParams.get('preview') === 'true'
  const user = useAuthStore((state) => state.user)
  const [savedLayout, setSavedLayout] = useState<Record<string, unknown> | null | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)

  // Carregar layout salvo
  useEffect(() => {
    if (!user?.storeId) {
      setIsLoading(false)
      setSavedLayout(null)
      return
    }

    const loadLayout = async () => {
      try {
        const response = await apiClient.get<{
          layout_json: Record<string, unknown> | null
          updated_at?: string
        }>('/editor/layout/admin')

        if (response.data?.layout_json) {
          setSavedLayout(response.data.layout_json)
        } else {
          setSavedLayout(null)
        }
      } catch (error) {
        // Se não houver layout salvo (404) ou outro erro, continuar sem layout
        // O editor vai começar vazio
        console.warn('Layout não encontrado ou erro ao carregar:', error)
        setSavedLayout(null)
      } finally {
        setIsLoading(false)
      }
    }

    loadLayout()
  }, [user?.storeId])

  if (isLoading || savedLayout === undefined) {
    return (
      <div className="flex  items-center justify-center">
        <div className="text-sm text-gray-500">Carregando editor...</div>
      </div>
    )
  }

  return (
    <ThemeProvider>
      <PreviewProvider>
        <div className="h-full flex flex-col overflow-hidden">
          <Editor
            resolver={resolver}
            enabled={!isPreview}
          >
            <EditorContentInner 
              savedLayout={savedLayout} 
              isPreview={isPreview} 
            />
          </Editor>
        </div>
      </PreviewProvider>
    </ThemeProvider>
  )
}

function EditorContentInner({ 
  savedLayout, 
  isPreview 
}: { 
  savedLayout: Record<string, unknown> | null
  isPreview: boolean 
}) {
  const { previewMode } = usePreviewMode()
  const frameRef = useRef<HTMLDivElement>(null)
  const { enabled } = useEditor((state: any) => ({
    enabled: state.options.enabled
  }))
  
  // Aplicar tema no Frame do Craft.js (o Frame renderiza dentro do frameRef)
  useEffect(() => {
    const applyThemeToFrame = () => {
      if (frameRef.current) {
        // O Craft.js renderiza diretamente no DOM, não em iframe
        // Aplicar as variáveis CSS no elemento do frame
        const computedStyle = getComputedStyle(document.documentElement)
        const primaryColor = computedStyle.getPropertyValue('--store-primary-color').trim()
        const secondaryColor = computedStyle.getPropertyValue('--store-secondary-color').trim()
        const textColor = computedStyle.getPropertyValue('--store-text-color').trim()
        const iconColor = computedStyle.getPropertyValue('--store-icon-color').trim()
        
        if (primaryColor) {
          frameRef.current.style.setProperty('--store-primary-color', primaryColor)
        }
        if (secondaryColor) {
          frameRef.current.style.setProperty('--store-secondary-color', secondaryColor)
        }
        if (textColor) {
          frameRef.current.style.setProperty('--store-text-color', textColor)
        }
        if (iconColor) {
          frameRef.current.style.setProperty('--store-icon-color', iconColor)
        }
      }
    }
    
    // Aplicar imediatamente e depois de um delay para garantir que o Frame foi renderizado
    applyThemeToFrame()
    const timer = setTimeout(applyThemeToFrame, 100)
    return () => clearTimeout(timer)
  }, [])

  // Interceptar todos os cliques em links quando o editor está habilitado
  useEffect(() => {
    if (!enabled || isPreview) return

    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const link = target.closest('a')
      
      if (link) {
        e.preventDefault()
        e.stopPropagation()
        return false
      }
    }

    const frameElement = frameRef.current
    if (frameElement) {
      frameElement.addEventListener('click', handleLinkClick, true)
      return () => {
        frameElement.removeEventListener('click', handleLinkClick, true)
      }
    }
  }, [enabled, isPreview])

  // Tamanhos de preview para cada dispositivo
  const previewSizes = {
    desktop: {
      maxWidth: '100%',
      width: '100%',
      minHeight: '100%'
    },
    tablet: {
      maxWidth: '768px',
      width: '768px',
      minHeight: '1024px'
    },
    mobile: {
      maxWidth: '375px',
      width: '375px',
      minHeight: '667px'
    }
  }

  const currentSize = previewSizes[previewMode]

  return (
    <>
      <EditorTopbar isPreview={isPreview} />
      <div className="flex-1 flex overflow-hidden bg-white">
        {!isPreview && <EditorToolbox />}
        <div className="flex-1 overflow-y-auto overflow-x-hidden bg-gray-50 flex items-start justify-center p-4 md:p-10">
          <div 
            ref={frameRef}
            className="bg-white shadow-lg transition-all duration-300"
            style={{ 
              width: currentSize.width,
              maxWidth: currentSize.maxWidth,
              minHeight: currentSize.minHeight
            }}
          >
            {savedLayout ? (
              <Frame data={savedLayout as any} />
            ) : (
              <Frame>
                <Element canvas is="div">
                  <Hero />
                </Element>
              </Frame>
            )}
          </div>
        </div>
        {!isPreview && <EditorSettingsPanel />}
      </div>
    </>
  )
}

export default function EditorPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center">
          <div className="text-sm text-gray-500">Carregando editor...</div>
        </div>
      }
    >
      <EditorContent />
    </Suspense>
  )
}

