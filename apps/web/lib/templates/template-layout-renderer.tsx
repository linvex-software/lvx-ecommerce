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
import { validateAndCleanLayout, createSafeDefaultLayout } from './layout-validator'
import { Spinner } from '@/components/ui/spinner'

interface TemplateLayoutRendererProps {
  templateId: string
  initialLayoutJson?: string | null
}

export function TemplateLayoutRenderer({ templateId, initialLayoutJson }: TemplateLayoutRendererProps) {
  const [layoutJson, setLayoutJson] = useState<string | null>(initialLayoutJson || null)
  const [resolver, setResolver] = useState<Record<string, any>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadTemplate = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Marcar início do carregamento para medição de performance
        if (typeof window !== 'undefined' && window.performance) {
          performance.mark('template-load-start')
        }

        // 1. Se initialLayoutJson foi fornecido, usar ele (prioridade máxima)
        let savedLayout: Record<string, unknown> | null = null
        
        if (initialLayoutJson) {
          try {
            savedLayout = JSON.parse(initialLayoutJson) as Record<string, unknown>
          } catch (error) {
            console.error('[TemplateLayoutRenderer] Erro ao parsear initialLayoutJson:', error)
          }
        }
        
        // 2. Paralelizar carregamento de componentes e layout quando possível
        const loadComponents = loadTemplateComponents(templateId)
        const loadLayout = !savedLayout
          ? fetchAPI('/editor/layout', { method: 'GET' }).catch((apiError: any) => {
              // Se não houver layout salvo (404), retornar null para usar layout padrão
              if (apiError?.status === 404) {
                return { layout_json: null }
              }
              console.error('[TemplateLayoutRenderer] Erro ao carregar layout salvo:', apiError)
              return { layout_json: null }
            })
          : Promise.resolve({ layout_json: null })

        // Carregar componentes e layout em paralelo
        const [componentResolver, layoutData] = await Promise.all([loadComponents, loadLayout])
        setResolver(componentResolver)

        // Se não houver layout inicial e houver resposta da API, usar ela
        if (!savedLayout && layoutData?.layout_json && typeof layoutData.layout_json === 'object') {
          savedLayout = layoutData.layout_json as Record<string, unknown>
        }

        // 3. Se não houver layout salvo, usar layout padrão do template
        if (!savedLayout) {
          savedLayout = await loadTemplateLayout(templateId)
        }

        // 4. Validar e limpar o layout antes de desserializar
        // Remove componentes inválidos que não existem no resolver
        // SEMPRE retorna um layout válido (cria padrão se necessário)
        let finalLayout: Record<string, unknown>
        
        if (savedLayout) {
          // Tentar validar, mas se remover tudo, usar o original
          const cleaned = validateAndCleanLayout(savedLayout, componentResolver)
          
          // Se a validação removeu muitos nós, pode ser que o resolver não tenha os componentes
          // Nesse caso, usar o layout original e deixar o Craft.js lidar com erros
          const originalNodeCount = Object.keys(savedLayout).length
          const cleanedNodeCount = Object.keys(cleaned).length
          const removedPercentage = originalNodeCount > 0 
            ? ((originalNodeCount - cleanedNodeCount) / originalNodeCount) * 100 
            : 0
          
          if (removedPercentage > 50) {
            finalLayout = savedLayout
          } else {
            finalLayout = cleaned
          }
        } else {
          finalLayout = createSafeDefaultLayout()
        }
        
        // 5. Serializar para JSON string (como o Craft.js espera)
        const jsonString = JSON.stringify(finalLayout)
        setLayoutJson(jsonString)

        // Medir performance do carregamento
        if (typeof window !== 'undefined' && window.performance) {
          performance.mark('template-load-end')
          performance.measure('template-load-duration', 'template-load-start', 'template-load-end')
          
          const measure = performance.getEntriesByName('template-load-duration')[0]
          if (measure) {
            const duration = measure.duration
            // Log apenas em desenvolvimento para não poluir produção
            if (process.env.NODE_ENV === 'development') {
              console.log(`[Performance] Template carregado em ${duration.toFixed(2)}ms`)
            }
            // Em produção, você pode enviar para analytics
            // analytics.track('template_load_time', { duration })
          }
        }
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
      loadTemplate()
    }
    
    window.addEventListener('layout-saved', handleLayoutSaved)
    
    return () => {
      window.removeEventListener('layout-saved', handleLayoutSaved)
    }
  }, [templateId, initialLayoutJson])

  if (isLoading || !layoutJson || Object.keys(resolver).length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
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

  // Verificar se o layout JSON é válido antes de passar para o Frame
  // O Craft só deve receber data quando existir layout válido
  let safeData: string | undefined
  try {
    if (layoutJson) {
      const parsed = JSON.parse(layoutJson)
      safeData = parsed && Object.keys(parsed).length > 0 ? layoutJson : undefined
    }
  } catch {
    safeData = undefined
  }

  // Renderizar usando Craft.js Editor + Frame
  // O Frame vai deserializar automaticamente o JSON usando o resolver
  return (
    <Editor
      resolver={resolver}
      enabled={false} // Desabilitar edição no storefront
    >
      <Frame data={safeData} />
    </Editor>
  )
}

