'use client'

/**
 * Renderizador de Layout de Template usando Craft.js
 * 
 * Este componente usa Craft.js Editor + Frame para deserializar e renderizar
 * o layout JSON exatamente como foi salvo no editor.
 * 
 * IMPORTANTE: Este é o método CORRETO segundo a documentação do Craft.js.
 * Não renderiza manualmente - deixa o Craft.js fazer o trabalho.
 */

import React, { useEffect, useState } from 'react'
import { Editor, Frame } from '@craftjs/core'
import { loadTemplateLayout, loadTemplateComponents } from './template-loader'
import { fetchAPI } from '@/lib/api'

interface TemplateLayoutRendererProps {
  templateId: string
}

export function TemplateLayoutRenderer({ templateId }: TemplateLayoutRendererProps) {
  const [layoutJson, setLayoutJson] = useState<string | null>(null)
  const [resolver, setResolver] = useState<Record<string, any>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadTemplate = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // 1. Carregar resolver de componentes (compartilhado com o editor)
        const componentResolver = await loadTemplateComponents(templateId)
        setResolver(componentResolver)

        // 2. Tentar carregar layout salvo do banco de dados
        let savedLayout: Record<string, unknown> | null = null
        
        try {
          const data = await fetchAPI(`/editor/layout?t=${Date.now()}`, {
            method: 'GET',
            cache: 'no-store',
          })
          
          if (data.layout_json && typeof data.layout_json === 'object') {
            savedLayout = data.layout_json as Record<string, unknown>
            console.log('[TemplateLayoutRenderer] ✅ Layout salvo carregado do banco')
          }
        } catch (apiError: any) {
          // Se não houver layout salvo (404), usar layout padrão
          if (apiError?.status === 404) {
            console.log('[TemplateLayoutRenderer] Layout não encontrado - usando layout padrão')
          } else {
            console.warn('[TemplateLayoutRenderer] Erro ao carregar layout salvo:', apiError)
          }
        }

        // 3. Se não houver layout salvo, usar layout padrão do template
        if (!savedLayout) {
          console.log('[TemplateLayoutRenderer] Carregando layout padrão do template')
          savedLayout = await loadTemplateLayout(templateId)
        }

        // 4. Serializar para JSON string (como o Craft.js espera)
        const jsonString = JSON.stringify(savedLayout)
        setLayoutJson(jsonString)
        
        console.log('[TemplateLayoutRenderer] ✅ Layout carregado e pronto para deserialização')
      } catch (err) {
        console.error('[TemplateLayoutRenderer] Erro ao carregar template:', err)
        setError('Erro ao carregar template')
      } finally {
        setIsLoading(false)
      }
    }

    loadTemplate()

    // Recarregar quando o layout for salvo no editor
    const handleLayoutSaved = () => {
      console.log('[TemplateLayoutRenderer] Layout foi salvo, recarregando...')
      loadTemplate()
    }
    
    window.addEventListener('layout-saved', handleLayoutSaved)
    
    return () => {
      window.removeEventListener('layout-saved', handleLayoutSaved)
    }
  }, [templateId])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-sm text-gray-500">Carregando template...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-sm text-red-500">{error}</div>
      </div>
    )
  }

  if (!layoutJson || Object.keys(resolver).length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-sm text-gray-500">Preparando renderização...</div>
      </div>
    )
  }

  // Renderizar usando Craft.js Editor + Frame
  // O Frame vai deserializar automaticamente o JSON usando o resolver
  return (
    <Editor
      resolver={resolver}
      enabled={false} // Desabilitar edição no storefront
    >
      <Frame data={layoutJson} />
    </Editor>
  )
}

