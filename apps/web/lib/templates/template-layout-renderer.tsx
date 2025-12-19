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

        // 1. Carregar resolver de componentes (compartilhado com o editor)
        const componentResolver = await loadTemplateComponents(templateId)
        setResolver(componentResolver)

        // 2. Se initialLayoutJson foi fornecido, usar ele (prioridade máxima)
        let savedLayout: Record<string, unknown> | null = null
        
        if (initialLayoutJson) {
          try {
            savedLayout = JSON.parse(initialLayoutJson) as Record<string, unknown>
            console.log('[TemplateLayoutRenderer] ✅ Layout inicial fornecido via prop')
          } catch (error) {
            console.warn('[TemplateLayoutRenderer] Erro ao parsear initialLayoutJson:', error)
          }
        }
        
        // 3. Se não houver layout inicial, tentar carregar do banco de dados
        // Usar timestamp para evitar cache
        const cacheBuster = Date.now()
        if (!savedLayout) {
          try {
            const data = await fetchAPI(`/editor/layout?t=${cacheBuster}&_=${Math.random()}`, {
              method: 'GET',
              cache: 'no-store',
            })
            
            if (data.layout_json && typeof data.layout_json === 'object') {
              savedLayout = data.layout_json as Record<string, unknown>
              
              // Debug: Verificar EditableTexts no layout carregado
              const editableTextNodes: any[] = []
              const findEditableTexts = (nodeId: string, node: any, visited = new Set<string>()) => {
                if (visited.has(nodeId)) return
                visited.add(nodeId)
                
                if (node?.type?.resolvedName === 'EditableText') {
                  editableTextNodes.push({
                    nodeId,
                    content: node.props?.content || '',
                    hasContent: !!node.props?.content
                  })
                }
                
                if (node?.nodes) {
                  for (const childId of node.nodes) {
                    const childNode = savedLayout[childId]
                    if (childNode) {
                      findEditableTexts(childId, childNode, visited)
                    }
                  }
                }
              }
              
              if (savedLayout.ROOT) {
                findEditableTexts('ROOT', savedLayout.ROOT)
              }
              
              console.log('[TemplateLayoutRenderer] ✅ Layout salvo carregado do banco:', {
                totalNodes: Object.keys(savedLayout).length,
                rootNodes: (savedLayout.ROOT as any)?.nodes?.length || 0,
                editableTextCount: editableTextNodes.length,
                editableTextsWithContent: editableTextNodes.filter(n => n.hasContent).length,
                editableTexts: editableTextNodes.slice(0, 5) // Primeiros 5 para debug
              })
            }
          } catch (apiError: any) {
            // Se não houver layout salvo (404), usar layout padrão
            if (apiError?.status === 404) {
              console.log('[TemplateLayoutRenderer] Layout não encontrado - usando layout padrão')
            } else {
              console.warn('[TemplateLayoutRenderer] Erro ao carregar layout salvo:', apiError)
            }
          }
        }

        // 4. Se não houver layout salvo, usar layout padrão do template
        if (!savedLayout) {
          console.log('[TemplateLayoutRenderer] Carregando layout padrão do template')
          savedLayout = await loadTemplateLayout(templateId)
        }

        // 4. Validar e limpar o layout antes de desserializar
        // Remove componentes inválidos que não existem no resolver
        // SEMPRE retorna um layout válido (cria padrão se necessário)
        console.log('[TemplateLayoutRenderer] Layout antes da validação:', {
          hasRoot: !!savedLayout?.ROOT,
          totalNodes: Object.keys(savedLayout || {}).length,
          rootNodes: (savedLayout?.ROOT as any)?.nodes?.length || 0
        })
        console.log('[TemplateLayoutRenderer] Componentes no resolver:', Object.keys(componentResolver).slice(0, 20))
        
        let finalLayout: Record<string, unknown>
        
        if (savedLayout) {
          // Tentar validar, mas se remover tudo, usar o original
          const cleaned = validateAndCleanLayout(savedLayout, componentResolver)
          
          // Se a validação removeu muitos nós, pode ser que o resolver não tenha os componentes
          // Nesse caso, usar o layout original e deixar o Craft.js lidar com erros
          const originalNodeCount = Object.keys(savedLayout).length
          const cleanedNodeCount = Object.keys(cleaned).length
          const removedPercentage = ((originalNodeCount - cleanedNodeCount) / originalNodeCount) * 100
          
          if (removedPercentage > 50) {
            console.warn(`[TemplateLayoutRenderer] Validação removeu ${removedPercentage.toFixed(0)}% dos nós. Usando layout original.`)
            finalLayout = savedLayout
          } else {
            finalLayout = cleaned
          }
        } else {
          finalLayout = createSafeDefaultLayout()
        }
        
        // Debug: Verificar EditableTexts após validação
        const editableTextNodesAfter: any[] = []
        const findEditableTextsAfter = (nodeId: string, node: any, visited = new Set<string>()) => {
          if (visited.has(nodeId)) return
          visited.add(nodeId)
          
          if (node?.type?.resolvedName === 'EditableText') {
            editableTextNodesAfter.push({
              nodeId,
              content: node.props?.content || '',
              hasContent: !!node.props?.content
            })
          }
          
          if (node?.nodes) {
            for (const childId of node.nodes) {
              const childNode = finalLayout[childId]
              if (childNode) {
                findEditableTextsAfter(childId, childNode, visited)
              }
            }
          }
        }
        
        if (finalLayout.ROOT) {
          findEditableTextsAfter('ROOT', finalLayout.ROOT)
        }
        
        console.log('[TemplateLayoutRenderer] Layout após validação:', {
          hasRoot: !!finalLayout?.ROOT,
          totalNodes: Object.keys(finalLayout || {}).length,
          rootNodes: (finalLayout?.ROOT as any)?.nodes?.length || 0,
          editableTextCount: editableTextNodesAfter.length,
          editableTextsWithContent: editableTextNodesAfter.filter(n => n.hasContent).length,
          editableTexts: editableTextNodesAfter.slice(0, 5) // Primeiros 5 para debug
        })
        
        // 5. Serializar para JSON string (como o Craft.js espera)
        const jsonString = JSON.stringify(finalLayout)
        setLayoutJson(jsonString)
        
        console.log('[TemplateLayoutRenderer] ✅ Layout carregado e validado, pronto para deserialização')
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
      // Forçar recarregamento ignorando cache
      loadTemplate()
    }
    
    window.addEventListener('layout-saved', handleLayoutSaved)
    
    return () => {
      window.removeEventListener('layout-saved', handleLayoutSaved)
    }
  }, [templateId, initialLayoutJson])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-sm text-gray-500">Carregando loja...</div>
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

