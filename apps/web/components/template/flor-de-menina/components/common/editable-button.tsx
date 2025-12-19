'use client'

import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useNode } from '@craftjs/core'
import { useSafeNode } from '../../lib/hooks/use-safe-node'
import { Button } from '../ui/button'
import { X } from 'lucide-react'

interface EditableButtonProps {
  children?: React.ReactNode
  text?: string
  backgroundColor?: string
  textColor?: string
  link?: string
  className?: string
  variant?: 'default' | 'outline' | 'elegant'
  size?: 'default' | 'sm' | 'lg' | 'xl'
  id?: string
  asChild?: boolean
  // Callback para notificar mudanças ao componente pai
  onUpdate?: (props: { text: string; backgroundColor?: string; textColor?: string }) => void
}

export function EditableButton({
  children,
  text: textProp,
  backgroundColor: backgroundColorProp,
  textColor: textColorProp,
  link: linkProp,
  className = '',
  variant = 'default',
  size = 'default',
  id: nodeIdProp,
  asChild = false,
  onUpdate,
}: EditableButtonProps) {
  // Tentar usar useNode do Craft.js
  let isInEditor = false
  let nodeActions: { setProp: (callback: (props: EditableButtonProps) => void) => void } | null = null
  let nodeConnectors: any = null
  let isSelected = false
  let isHovered = false
  let currentNodeId: string | null = null
  
  // Props do Craft.js
  let craftProps: EditableButtonProps | null = null

  try {
    const nodeResult = useNode((node) => ({
      isSelected: node.events.selected,
      isHovered: node.events.hovered,
      text: node.data.props.text,
      backgroundColor: node.data.props.backgroundColor,
      textColor: node.data.props.textColor,
      link: node.data.props.link,
      nodeId: node.id,
    }))
    
    const fullNode = useNode()
    
    isInEditor = true
    isSelected = nodeResult.isSelected
    isHovered = nodeResult.isHovered
    currentNodeId = nodeResult.nodeId
    
    nodeActions = fullNode.actions
    nodeConnectors = fullNode.connectors
    
    craftProps = {
      text: nodeResult.text,
      backgroundColor: nodeResult.backgroundColor,
      textColor: nodeResult.textColor,
      link: nodeResult.link,
    } as EditableButtonProps
  } catch {
    // Não está no contexto do Craft.js
    const { connectors } = useSafeNode()
    isInEditor = false
    nodeConnectors = {
      connect: connectors.connect,
      drag: connectors.connect,
    }
    nodeActions = {
      setProp: () => {},
    }
  }

  const setProp = nodeActions?.setProp || (() => {})
  
  // Verificar se está no editor através do parâmetro editable=true (iframe do preview)
  const [isInEditorMode, setIsInEditorMode] = React.useState(false)
  
  React.useEffect(() => {
    if (typeof window === 'undefined') {
      setIsInEditorMode(false) // SSR nunca está no editor
      return
    }
    
    const urlParams = new URLSearchParams(window.location.search)
    const isEditable = urlParams.get('editable') === 'true'
    const isInIframe = window.self !== window.top
    const pathname = window.location.pathname
    const isPreviewPage = pathname === '/preview'
    
    // Está no editor APENAS se TODAS as condições forem atendidas:
    // 1. Está na página /preview
    // 2. Tem editable=true na URL
    // 3. Está em iframe (dentro do editor)
    // 4. Tem contexto do Craft.js (isInEditor)
    // Isso garante que os botões NÃO apareçam na loja pública
    const shouldBeInEditor = isPreviewPage && isEditable && isInIframe && isInEditor
    
    setIsInEditorMode(shouldBeInEditor)
  }, [isInEditor])

  // Usar props do Craft.js quando no editor, senão usar props passadas
  const text = isInEditor && craftProps?.text !== undefined ? craftProps.text : (textProp || '')
  const backgroundColor = isInEditor && craftProps?.backgroundColor !== undefined ? craftProps.backgroundColor : backgroundColorProp
  const textColor = isInEditor && craftProps?.textColor !== undefined ? craftProps.textColor : textColorProp
  const link = isInEditor && craftProps?.link !== undefined ? craftProps.link : linkProp

  const [isEditing, setIsEditing] = useState(false)
  const [localText, setLocalText] = useState(text || '')
  const [localBackgroundColor, setLocalBackgroundColor] = useState(backgroundColor || '')
  const [localTextColor, setLocalTextColor] = useState(textColor || '')

  // Sincronizar estado local com props quando não estiver editando
  useEffect(() => {
    if (!isEditing) {
      setLocalText(text || '')
      setLocalBackgroundColor(backgroundColor || '')
      setLocalTextColor(textColor || '')
    }
  }, [text, backgroundColor, textColor, isEditing])

  useEffect(() => {
    if (!isSelected && isEditing) {
      handleSave()
    } else if (!isSelected) {
      setIsEditing(false)
    }
  }, [isSelected])

  const handleClick = (e: React.MouseEvent) => {
    // No editor, permitir clique simples para selecionar
    if (isInEditor && isInEditorMode) {
      e.stopPropagation()
      // O Craft.js já cuida da seleção, apenas garantir que o evento não propague
    }
  }

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (isInEditor && isInEditorMode) {
      e.preventDefault()
      e.stopPropagation()
      setIsEditing(true)
    }
  }

  const handleSave = () => {
    if (!setProp || typeof setProp !== 'function') {
      setIsEditing(false)
      return
    }
    
    try {
      setProp((props: EditableButtonProps) => {
        props.text = localText
        if (localBackgroundColor !== undefined) props.backgroundColor = localBackgroundColor
        if (localTextColor !== undefined) props.textColor = localTextColor
        if (nodeIdProp !== undefined) props.id = nodeIdProp
      })
      
      // Notificar o componente pai sobre a mudança
      if (onUpdate) {
        onUpdate({
          text: localText,
          backgroundColor: localBackgroundColor,
          textColor: localTextColor,
        })
      }
      
      // Também disparar evento customizado para componentes que escutam
      if (nodeIdProp) {
        const event = new CustomEvent('editable-button-updated', {
          detail: {
            buttonId: nodeIdProp,
            text: localText,
            backgroundColor: localBackgroundColor,
            textColor: localTextColor,
          }
        })
        window.dispatchEvent(event)
      }
      
      setIsEditing(false)
    } catch (error) {
      console.error('[EditableButton] Erro ao salvar props:', error)
      setIsEditing(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setLocalText(text || '')
    setLocalBackgroundColor(backgroundColor || '')
    setLocalTextColor(textColor || '')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault()
      handleSave()
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      handleCancel()
    }
  }

  const modalRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Estilos do botão
  const buttonStyle: React.CSSProperties = {
    ...(localBackgroundColor && { backgroundColor: localBackgroundColor }),
    ...(localTextColor && { color: localTextColor }),
  }

  const displayText = isEditing ? localText : text
  const displayBackgroundColor = isEditing ? localBackgroundColor : backgroundColor
  const displayTextColor = isEditing ? localTextColor : textColor

  const baseClasses = `${className} ${isSelected && isInEditor && isInEditorMode ? 'ring-2 ring-blue-500 ring-offset-2' : ''} ${isHovered && isInEditor && isInEditorMode ? 'ring-1 ring-blue-300' : ''}`

  if (isEditing && isInEditor && isInEditorMode && mounted) {
    const modalContent = (
      <>
        <div 
          className="fixed inset-0 z-[9998] bg-black/20"
          style={{ pointerEvents: 'none' }}
        />
        <div
          ref={modalRef}
          data-modal="true"
          className="fixed z-[9999] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 min-w-[320px] max-w-[500px] bg-white rounded-lg shadow-2xl border-2 border-blue-500 p-4 space-y-4"
          onKeyDown={handleKeyDown}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between pb-2 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900">Editar Botão</h3>
            <button
              onClick={(e) => {
                e.stopPropagation()
                e.preventDefault()
                handleCancel()
              }}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
              Texto do Botão
            </label>
            <input
              type="text"
              value={localText}
              onChange={(e) => setLocalText(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full px-3 py-2.5 text-sm text-gray-900 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                Cor de Fundo
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={localBackgroundColor || '#C2185B'}
                  onChange={(e) => setLocalBackgroundColor(e.target.value)}
                  className="w-10 h-10 border-2 border-gray-300 rounded-md cursor-pointer hover:border-blue-500 transition-colors"
                />
                <input
                  type="text"
                  value={localBackgroundColor || ''}
                  onChange={(e) => setLocalBackgroundColor(e.target.value)}
                  placeholder="#C2185B"
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                Cor do Texto
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={localTextColor || '#FFFFFF'}
                  onChange={(e) => setLocalTextColor(e.target.value)}
                  className="w-10 h-10 border-2 border-gray-300 rounded-md cursor-pointer hover:border-blue-500 transition-colors"
                />
                <input
                  type="text"
                  value={localTextColor || ''}
                  onChange={(e) => setLocalTextColor(e.target.value)}
                  placeholder="#FFFFFF"
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">Ctrl+Enter</kbd> para salvar
            </p>
            <div className="flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  e.preventDefault()
                  handleCancel()
                }}
                data-modal-button="true"
                className="px-4 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  e.preventDefault()
                  handleSave()
                }}
                data-modal-button="true"
                type="button"
                className="px-4 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      </>
    )

    return typeof document !== 'undefined' 
      ? createPortal(modalContent, document.body)
      : null
  }

  const elementRef = (ref: HTMLElement | null) => {
    if (ref && isInEditor && nodeConnectors) {
      if (nodeConnectors.connect && nodeConnectors.drag) {
        nodeConnectors.connect(nodeConnectors.drag(ref))
      } else if (nodeConnectors.connect) {
        nodeConnectors.connect(ref)
      }
    }
  }

  const buttonContent = displayText || children

  if (asChild) {
    // Se asChild, retornar apenas o conteúdo para ser usado dentro de um Button
    // IMPORTANTE: Prevenir que o Link bloqueie o clique duplo
    return (
      <span
        ref={elementRef}
        className={`${baseClasses} ${isSelected && isInEditor && isInEditorMode ? 'cursor-text' : ''} ${isHovered && isInEditor && isInEditorMode ? 'ring-1 ring-blue-300' : ''}`}
        style={{
          ...buttonStyle,
          pointerEvents: 'auto',
        }}
        onDoubleClick={handleDoubleClick}
        onClick={(e) => {
          // No editor, bloquear navegação do link
          if (isInEditor && isInEditorMode) {
            e.preventDefault()
            e.stopPropagation()
            handleClick(e)
          }
        }}
        onMouseDown={(e) => {
          // No editor, prevenir que o link seja clicado
          if (isInEditor && isInEditorMode) {
            e.preventDefault()
            e.stopPropagation()
          }
        }}
        title={isSelected && isInEditor && isInEditorMode ? 'Duplo clique para editar' : (isInEditor && isInEditorMode ? 'Clique para selecionar, duplo clique para editar' : '')}
        data-editable-button="true"
      >
        {buttonContent}
      </span>
    )
  }

  return (
    <Button
      ref={elementRef}
      variant={variant}
      size={size}
      className={baseClasses}
      style={buttonStyle}
      onDoubleClick={handleDoubleClick}
      title={isSelected && isInEditor && isInEditorMode ? 'Duplo clique para editar' : ''}
    >
      {buttonContent}
    </Button>
  )
}

EditableButton.craft = {
  displayName: 'Botão Editável',
  props: {
    text: '',
    backgroundColor: '',
    textColor: '',
    link: '',
    id: '',
  },
}

