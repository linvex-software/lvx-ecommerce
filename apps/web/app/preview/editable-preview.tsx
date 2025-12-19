'use client'

import { useEffect, useState, useRef } from 'react'
import { Editor, Frame, useEditor } from '@craftjs/core'
import { validateAndCleanLayout, createSafeDefaultLayout } from '@/lib/templates/layout-validator'
import { loadTemplateLayout } from '@/lib/templates/template-loader'

interface EditablePreviewProps {
  templateId: string
  resolver: Record<string, any>
  initialLayoutJson: string | null
  onLayoutChange?: (layout: string) => void
}

/**
 * Componente que renderiza o preview editável com Craft.js
 */
function EditablePreviewContent({ 
  templateId,
  resolver, 
  initialLayoutJson,
  onLayoutChange 
}: EditablePreviewProps) {
  // Use useEditor with collector to track state changes
  const { actions, query, updatedNodeIds } = useEditor((state) => ({
    updatedNodeIds: state.events.updated
  }))
  const [isLoading, setIsLoading] = useState(true)
  const [safeData, setSafeData] = useState<string | undefined>(undefined)
  const isMounted = useRef(false)
  const lastSerialized = useRef<string>('')
  const isUpdatingFromParent = useRef(false)
  const initialLayoutLoaded = useRef(false)
  const lastInitialLayoutJson = useRef<string | null>(null)

  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])

  // Carregar e deserializar layout inicial
  useEffect(() => {
    // Não carregar layout se o resolver estiver vazio
    const resolverKeys = Object.keys(resolver)
    if (resolverKeys.length === 0) {
      console.log('[EditablePreview] Aguardando resolver ser carregado...')
      return
    }

    const loadLayout = async () => {
      setIsLoading(true)
      let layoutToUse: Record<string, unknown> | null = null

      // 1. Tentar usar initialLayoutJson se fornecido
      if (initialLayoutJson) {
        try {
          const parsed = JSON.parse(initialLayoutJson)
          if (parsed && Object.keys(parsed).length > 0) {
            layoutToUse = parsed
            console.log('[EditablePreview] Usando layout inicial fornecido')
          }
        } catch (error) {
          console.warn('[EditablePreview] Erro ao parsear initialLayoutJson:', error)
        }
      }

      // 2. Se não houver layout inicial, aguardar postMessage do parent
      // Não carregar template padrão para evitar flash
      if (!layoutToUse) {
        console.log('[EditablePreview] Sem layout inicial, aguardando postMessage do parent')
        setIsLoading(true)
        // Manter isLoading true até receber layout via postMessage
        return
      }

      // 3. Validar e limpar layout (só se o resolver estiver carregado)
      if (layoutToUse) {
        // Coletar tipos de componentes no layout
        const layoutTypes = new Set<string>()
        const collectLayoutTypes = (node: any) => {
          if (node?.type?.resolvedName) {
            layoutTypes.add(node.type.resolvedName)
          }
          if (node?.nodes) {
            for (const childId of node.nodes) {
              const childNode = layoutToUse[childId]
              if (childNode) collectLayoutTypes(childNode)
            }
          }
        }
        if (layoutToUse.ROOT) collectLayoutTypes(layoutToUse.ROOT)
        
        console.log('[EditablePreview] Resolver antes da validação:', {
          resolverKeys: resolverKeys.slice(0, 20),
          resolverCount: resolverKeys.length,
          layoutComponentTypes: Array.from(layoutTypes),
          hasHeader: 'Header' in resolver,
          hasEditableText: 'EditableText' in resolver,
          hasHeroBanner: 'HeroBanner' in resolver,
          layoutHasHeader: layoutTypes.has('Header'),
          layoutHasEditableText: layoutTypes.has('EditableText')
        })
        const cleaned = validateAndCleanLayout(layoutToUse, resolver)
        console.log('[EditablePreview] Layout validado e limpo', {
          hasRoot: !!cleaned?.ROOT,
          totalNodes: Object.keys(cleaned || {}).length,
          rootNodes: (cleaned?.ROOT as any)?.nodes?.length || 0,
          cleanedRootNodes: (cleaned?.ROOT as any)?.nodes
        })
        
        // Verificar se o layout limpo tem conteúdo válido
        const hasValidContent = cleaned && 
          cleaned.ROOT && 
          Object.keys(cleaned).length > 1 && // Mais que apenas ROOT
          (cleaned.ROOT as any)?.nodes?.length > 0
        
        if (!hasValidContent) {
          console.warn('[EditablePreview] Layout limpo está vazio! Usando layout original sem validação.')
          // Se a validação removeu tudo, usar o layout original
          if (isMounted.current) {
            actions.deserialize(layoutToUse)
            lastSerialized.current = query.serialize()
            setSafeData(JSON.stringify(layoutToUse))
            setIsLoading(false)
            initialLayoutLoaded.current = true
            lastInitialLayoutJson.current = initialLayoutJson
          }
          return
        }
        
        // 4. Deserializar no Craft.js (Frame renderiza automaticamente do estado)
        if (isMounted.current) {
          actions.deserialize(cleaned)
          lastSerialized.current = query.serialize()
          setSafeData(JSON.stringify(cleaned))
          setIsLoading(false)
          initialLayoutLoaded.current = true
          lastInitialLayoutJson.current = initialLayoutJson
          
          // Notificar parent que o layout foi aplicado
          setTimeout(() => {
            if (window.parent) {
              window.parent.postMessage({ action: 'LAYOUT_APPLIED' }, '*')
            }
          }, 100)
        }
      } else {
        if (isMounted.current) {
          const defaultLayout = createSafeDefaultLayout()
          actions.deserialize(defaultLayout)
          lastSerialized.current = query.serialize()
          setSafeData(JSON.stringify(defaultLayout))
          setIsLoading(false)
          initialLayoutLoaded.current = true
          lastInitialLayoutJson.current = initialLayoutJson
        }
      }
    }

    loadLayout()
  }, [templateId, resolver, actions, query, initialLayoutJson])

  // Escutar evento customizado para atualizações de layout do pai
  useEffect(() => {
    const handleLayoutUpdated = (event: CustomEvent) => {
      if (!isMounted.current || !event.detail) return
      
      try {
        const layout = typeof event.detail === 'string' ? JSON.parse(event.detail) : event.detail
        if (layout && Object.keys(layout).length > 0) {
          console.log('[EditablePreview] Recebendo atualização de layout do pai')
          isUpdatingFromParent.current = true
          const cleaned = validateAndCleanLayout(layout, resolver)
          actions.deserialize(cleaned)
          lastSerialized.current = query.serialize()
          setSafeData(JSON.stringify(cleaned))
          
          // Se estava aguardando layout, marcar como carregado
          if (isLoading) {
            setIsLoading(false)
            initialLayoutLoaded.current = true
          }
          
          // Notificar parent que o layout foi aplicado
          setTimeout(() => {
            if (window.parent) {
              window.parent.postMessage({ action: 'LAYOUT_APPLIED' }, '*')
            }
          }, 100)
          
          // Resetar flag após um delay
          setTimeout(() => {
            isUpdatingFromParent.current = false
          }, 1000)
        }
      } catch (error) {
        console.warn('[EditablePreview] Erro ao processar layout atualizado:', error)
      }
    }

    window.addEventListener('layout-updated' as any, handleLayoutUpdated)

    return () => {
      window.removeEventListener('layout-updated' as any, handleLayoutUpdated)
    }
  }, [resolver, actions, query, isLoading])
  
  // Escutar mensagens do parent (iframe) para solicitar serialização
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Verificar origem para segurança (aceitar do admin)
      const origin = event.origin
      const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1')
      const isAdminOrigin = origin.includes('admin') || isLocalhost

      if (!isAdminOrigin) return

      if (event.data.action === 'REQUEST_LAYOUT_SERIALIZE') {
        console.log('[EditablePreview] Solicitação de serialização recebida do parent')
        try {
          // Aguardar um pouco para garantir que todas as mudanças foram processadas
          setTimeout(() => {
            const serialized = query.serialize()
            console.log('[EditablePreview] Enviando layout serializado para parent:', {
              serializedLength: serialized.length,
              nodeCount: Object.keys(JSON.parse(serialized)).length
            })
            
            // Enviar de volta para o parent
            if (window.parent) {
              window.parent.postMessage({
                action: 'LAYOUT_SERIALIZED',
                layout: serialized
              }, '*')
            }
          }, 100)
        } catch (error) {
          console.error('[EditablePreview] Erro ao serializar layout:', error)
        }
      }
    }

    window.addEventListener('message', handleMessage)

    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [query])

  // Atualizar layout quando initialLayoutJson mudar via prop (apenas após carregamento inicial)
  useEffect(() => {
    // Não fazer nada se ainda está carregando o layout inicial
    if (isLoading || !initialLayoutLoaded.current) return
    
    // Não fazer nada se o initialLayoutJson não mudou desde o último carregamento
    if (initialLayoutJson === lastInitialLayoutJson.current) return
    
    // Não fazer nada se não há initialLayoutJson
    if (!initialLayoutJson) return

    try {
      const parsed = JSON.parse(initialLayoutJson)
      if (parsed && Object.keys(parsed).length > 0) {
        console.log('[EditablePreview] Atualizando layout via prop initialLayoutJson (mudança detectada)')
        isUpdatingFromParent.current = true
        
        // Notificar parent que o layout foi aplicado após deserializar
        const notifyApplied = () => {
          if (window.parent) {
            window.parent.postMessage({ action: 'LAYOUT_APPLIED' }, '*')
          }
        }
        
        // Verificar se o layout limpo tem conteúdo válido
        const cleaned = validateAndCleanLayout(parsed, resolver)
        const hasValidContent = cleaned && 
          cleaned.ROOT && 
          Object.keys(cleaned).length > 1 && 
          (cleaned.ROOT as any)?.nodes?.length > 0
        
        if (!hasValidContent) {
          console.warn('[EditablePreview] Layout limpo está vazio após mudança! Usando layout original.')
          actions.deserialize(parsed)
        } else {
          actions.deserialize(cleaned)
        }
        
        lastSerialized.current = query.serialize()
        setSafeData(JSON.stringify(hasValidContent ? cleaned : parsed))
        lastInitialLayoutJson.current = initialLayoutJson
        
        // Notificar parent que o layout foi aplicado
        notifyApplied()
        
        setTimeout(() => {
          isUpdatingFromParent.current = false
        }, 1000)
      }
    } catch (error) {
      console.warn('[EditablePreview] Erro ao atualizar layout via prop:', error)
    }
  }, [initialLayoutJson, resolver, actions, query, isLoading])

  // Sincronizar mudanças do Craft.js com o pai
  useEffect(() => {
    if (!onLayoutChange) return
    // Ignorar mudanças que vieram do pai
    if (isUpdatingFromParent.current) return
    // Ignorar se não houver atualizações
    if (!updatedNodeIds || updatedNodeIds.length === 0) return

    if (isMounted.current) {
      try {
        const serialized = query.serialize()
        if (serialized && serialized !== lastSerialized.current) {
          lastSerialized.current = serialized
          onLayoutChange(serialized)
        }
      } catch (error) {
        console.warn('[EditablePreview] Erro ao serializar layout:', error)
      }
    }
  }, [updatedNodeIds, query, onLayoutChange])

  // Desabilitar todos os links no preview (apenas visualização, não interação)
  // IMPORTANTE: Este hook deve ser chamado sempre, antes de qualquer return condicional
  // Mas NÃO desabilitar botões dentro de modais ou elementos do Craft.js
  useEffect(() => {
    if (!isMounted.current) return

    // Desabilitar todos os links usando CSS
    const style = document.createElement('style')
    style.id = 'preview-disable-links'
    style.textContent = `
      a {
        pointer-events: none !important;
        cursor: default !important;
      }
      a:hover {
        text-decoration: none !important;
      }
      /* Permitir botões dentro de links no editor */
      a button[data-modal-button],
      a button[data-modal-button="true"] {
        pointer-events: auto !important;
        cursor: pointer !important;
        z-index: 10000 !important;
        position: relative !important;
      }
      /* Não desabilitar botões dentro de modais ou elementos do Craft.js */
      button[type="button"]:not([data-craft]):not([data-modal-button]) {
        pointer-events: none !important;
        cursor: default !important;
      }
      /* Permitir interação com modais */
      [data-modal] button,
      [data-modal] input,
      [data-modal] textarea,
      [data-modal] select {
        pointer-events: auto !important;
        cursor: auto !important;
      }
      /* Permitir interação com botões editáveis */
      [data-editable-button] {
        pointer-events: auto !important;
        cursor: text !important;
      }
      a [data-editable-button] {
        pointer-events: auto !important;
      }
      /* Bloquear cliques em botões no editor (exceto botões editáveis e modais) */
      button:not([data-editable-button]):not([data-modal-button]):not([data-craft]) {
        pointer-events: none !important;
        cursor: default !important;
      }
      /* Permitir interação com textos editáveis dentro de links */
      a [data-editable-text],
      a [data-editable-button] {
        pointer-events: auto !important;
      }
      /* Permitir interação com botões de configuração (settings) */
      button[data-modal-button],
      button[data-modal-button="true"],
      button[title*="Configurar"],
      button[title*="configurar"],
      button[title*="Alterar imagem"],
      button[title*="alterar imagem"] {
        pointer-events: auto !important;
        cursor: pointer !important;
        z-index: 9999 !important;
      }
      /* Garantir que botões de configuração sejam sempre clicáveis */
      button[data-modal-button]:hover {
        pointer-events: auto !important;
      }
      /* Garantir que ícones dentro dos botões não bloqueiem cliques */
      button[data-modal-button] svg,
      button[data-modal-button] * {
        pointer-events: none !important;
      }
      /* Garantir que o botão em si seja clicável */
      button[data-modal-button] {
        pointer-events: auto !important;
      }
    `
    document.head.appendChild(style)

    // Também prevenir cliques em links via JavaScript
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      // Não bloquear se estiver dentro de um modal
      if (target.closest('[data-modal]')) {
        return
      }
      // Permitir cliques em botões editáveis
      if (target.hasAttribute('data-editable-button') || target.closest('[data-editable-button]')) {
        return
      }
      if (target.tagName === 'A' || target.closest('a')) {
        e.preventDefault()
        e.stopPropagation()
        return false
      }
    }

    // Prevenir cliques em botões que não são do Craft.js e não estão em modais
    const handleButtonClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      // Não bloquear se estiver dentro de um modal ou for um botão do Craft.js
      if (target.closest('[data-modal]') || target.hasAttribute('data-craft') || target.hasAttribute('data-modal-button')) {
        return
      }
      // Permitir cliques em botões editáveis
      if (target.hasAttribute('data-editable-button') || target.closest('[data-editable-button]')) {
        return
      }
      // Bloquear todos os outros botões
      if (target.tagName === 'BUTTON' || target.closest('button')) {
        e.preventDefault()
        e.stopPropagation()
        return false
      }
    }

    document.addEventListener('click', handleLinkClick, true)
    document.addEventListener('click', handleButtonClick, true)

    return () => {
      const styleElement = document.getElementById('preview-disable-links')
      if (styleElement) {
        styleElement.remove()
      }
      document.removeEventListener('click', handleLinkClick, true)
      document.removeEventListener('click', handleButtonClick, true)
    }
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-sm text-gray-500">Carregando editor...</div>
      </div>
    )
  }

  // Usar data prop no Frame para carregamento inicial estável
  // Segundo a documentação do Craft.js, data é memoizado e usado para o carregamento inicial
  // actions.deserialize() é usado para atualizações posteriores
  return (
    <div className="min-h-screen w-full">
      <Frame data={safeData}>
        {/* O Craft.js renderiza o conteúdo automaticamente baseado no estado deserializado */}
      </Frame>
    </div>
  )
}

export function EditablePreview(props: EditablePreviewProps) {
  return (
    <Editor
      resolver={props.resolver}
      enabled={true} // Habilitar edição
    >
      <EditablePreviewContent {...props} />
    </Editor>
  )
}

