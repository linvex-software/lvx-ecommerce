'use client'

import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useNode, useEditor } from '@craftjs/core'
import { useSafeNode } from '../../lib/hooks/use-safe-node'

interface EditableTextProps {
  children?: React.ReactNode
  tag?: 'span' | 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'div'
  className?: string
  content?: string
  fontFamily?: string
  color?: string
  fontSize?: string
  fontWeight?: string
  lineHeight?: string
  letterSpacing?: string
  id?: string // ID único para identificar este EditableText no layout JSON
}

export function EditableText({
  children,
  tag = 'span',
  className = '',
  content: contentProp,
  fontFamily: fontFamilyProp,
  color: colorProp,
  fontSize: fontSizeProp,
  fontWeight: fontWeightProp,
  lineHeight: lineHeightProp,
  letterSpacing: letterSpacingProp,
  id: nodeIdProp,
}: EditableTextProps) {
  // Ref para rastrear se já tentamos criar o nó
  const nodeCreatedRef = useRef(false)
  
  // Tentar usar useEditor para adicionar nós filhos programaticamente
  let editorActions: any = null
  let editorQuery: any = null
  try {
    const editor = useEditor((state, query) => ({
      nodes: state.nodes,
    }))
    editorActions = editor.actions
    editorQuery = editor.query
  } catch {
    // Não está no contexto do editor
  }

  // Tentar usar useNode do Craft.js
  let isInEditor = false
  let nodeActions: { setProp: (callback: (props: EditableTextProps) => void) => void } | null = null
  let nodeConnectors: any = null
  let isSelected = false
  let isHovered = false
  let currentNodeId: string | null = null
  
  // Props do Craft.js - usar node.data.props diretamente (são específicas de cada nó)
  let craftProps: EditableTextProps | null = null

  try {
    // useNode retorna as props específicas deste nó específico
    // Cada instância do componente tem seu próprio nó com suas próprias props
    // CRÍTICO: Usar node.data.props diretamente no selector - são específicas de cada nó
    // node.props pode ser um getter que retorna objeto compartilhado
    // node.data.props são as props reais armazenadas neste nó específico
    const nodeResult = useNode((node) => ({
      isSelected: node.events.selected,
      isHovered: node.events.hovered,
      // Extrair props individuais de node.data.props diretamente
      // Isso garante que cada instância tenha suas próprias props isoladas
      content: node.data.props.content,
      fontFamily: node.data.props.fontFamily,
      color: node.data.props.color,
      fontSize: node.data.props.fontSize,
      fontWeight: node.data.props.fontWeight,
      lineHeight: node.data.props.lineHeight,
      letterSpacing: node.data.props.letterSpacing,
      id: node.data.props.id, // ID único passado como prop
      nodeId: node.id, // ID do nó no Craft.js (gerado automaticamente)
    }))
    
    // Obter o nó completo para acessar actions e connectors
    // IMPORTANTE: useNode() sem selector retorna o nó atual (do EditableText)
    // Não o nó do componente pai (HeroBanner, Header, etc)
    const fullNode = useNode()
    
    isInEditor = true
    isSelected = nodeResult.isSelected
    isHovered = nodeResult.isHovered
    currentNodeId = nodeResult.nodeId
    
    // DEBUG: Verificar qual nó está sendo usado
    if (nodeIdProp && currentNodeId) {
      console.log('[EditableText] Nó atual:', {
        nodeIdProp,
        currentNodeId,
        match: currentNodeId === nodeIdProp,
      })
    }
    
    // CRÍTICO: fullNode.actions.setProp atualiza APENAS o nó do EditableText atual
    // Não o nó do componente pai, porque useNode() retorna o nó do componente que o chama
    nodeActions = fullNode.actions
    nodeConnectors = fullNode.connectors
    
    // Usar as props extraídas diretamente de node.data.props
    // Essas props são específicas deste nó e não são compartilhadas
    craftProps = {
      content: nodeResult.content,
      fontFamily: nodeResult.fontFamily,
      color: nodeResult.color,
      fontSize: nodeResult.fontSize,
      fontWeight: nodeResult.fontWeight,
      lineHeight: nodeResult.lineHeight,
      letterSpacing: nodeResult.letterSpacing,
      id: nodeResult.id,
    } as EditableTextProps
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
  
  const connect = (ref: HTMLElement | null) => {
    if (ref && nodeConnectors?.connect) {
      nodeConnectors.connect(ref)
    }
  }
  
  const drag = (ref: HTMLElement | null) => {
    if (ref && nodeConnectors?.drag) {
      nodeConnectors.drag(ref)
    }
  }

  // IMPORTANTE: Quando no editor, usar APENAS props do Craft.js (node.data.props)
  // Essas props são específicas de cada nó e não são compartilhadas
  // Quando não está no editor, usar props passadas como parâmetro
  // FALLBACK: Se não houver content nas props do Craft.js, usar children ou contentProp como fallback
  // Isso garante que o texto apareça mesmo quando o layout.json não tem as props definidas
  const getContent = () => {
    if (isInEditor && craftProps) {
      // No editor: priorizar content das props do Craft.js, depois children, depois contentProp
      if (craftProps.content !== undefined && craftProps.content !== null && craftProps.content !== '') {
        return craftProps.content
      }
      if (typeof children === 'string' && children !== '') {
        return children
      }
      if (contentProp !== undefined && contentProp !== null && contentProp !== '') {
        return contentProp
      }
      return ''
    } else {
      // Fora do editor: priorizar contentProp, depois children
      if (contentProp !== undefined && contentProp !== null && contentProp !== '') {
        return contentProp
      }
      if (typeof children === 'string' && children !== '') {
        return children
      }
      return ''
    }
  }
  
  const content = getContent()
  
  const fontFamily = isInEditor && craftProps ? craftProps.fontFamily : fontFamilyProp
  const color = isInEditor && craftProps ? craftProps.color : colorProp
  const fontSize = isInEditor && craftProps ? craftProps.fontSize : fontSizeProp
  const fontWeight = isInEditor && craftProps ? craftProps.fontWeight : fontWeightProp
  const lineHeight = isInEditor && craftProps ? craftProps.lineHeight : lineHeightProp
  const letterSpacing = isInEditor && craftProps ? craftProps.letterSpacing : letterSpacingProp

  const [isEditing, setIsEditing] = useState(false)
  
  // Estado local apenas para edição temporária
  const [localContent, setLocalContent] = useState(content)
  const [localFontFamily, setLocalFontFamily] = useState(fontFamily || '')
  const [localColor, setLocalColor] = useState(color || '')

  // Sincronizar estado local com props quando não estiver editando
  useEffect(() => {
    if (!isEditing) {
      setLocalContent(content)
      setLocalFontFamily(fontFamily || '')
      setLocalColor(color || '')
    }
  }, [content, fontFamily, color, isEditing])

  useEffect(() => {
    if (!isSelected) {
      setIsEditing(false)
    }
  }, [isSelected])

  const handleDoubleClick = () => {
    if (isSelected && isInEditor) {
      setIsEditing(true)
    }
  }

  const handleSave = () => {
    // IMPORTANTE: setProp atualiza APENAS o nó atual (instância específica)
    // Cada instância do componente tem seu próprio nó no Craft.js
    // O Craft.js gerencia cada nó separadamente
    // DEBUG: Verificar qual nó está sendo atualizado
    if (isInEditor && currentNodeId) {
      const nodeIdFromProps = craftProps?.id || nodeIdProp
      console.log('[EditableText] Salvando props no nó:', currentNodeId, {
        id: nodeIdFromProps, // ID único passado como prop
        content: localContent,
        fontFamily: localFontFamily,
        color: localColor,
      })
    }
    
    setProp((props: EditableTextProps) => {
      // Atualizar apenas as props que foram editadas
      props.content = localContent
      if (localFontFamily !== undefined) props.fontFamily = localFontFamily
      if (localColor !== undefined) props.color = localColor
      // Manter outras props existentes, incluindo o ID único
      if (nodeIdProp !== undefined) props.id = nodeIdProp
      if (fontSize !== undefined) props.fontSize = fontSize
      if (fontWeight !== undefined) props.fontWeight = fontWeight
      if (lineHeight !== undefined) props.lineHeight = lineHeight
      if (letterSpacing !== undefined) props.letterSpacing = letterSpacing
    })
    setIsEditing(false)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setLocalContent(content)
    setLocalFontFamily(fontFamily || '')
    setLocalColor(color || '')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && e.ctrlKey) {
      e.preventDefault()
      handleSave()
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      handleCancel()
    }
  }

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault()
      handleSave()
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      handleCancel()
    }
  }

  // Usar props diretamente na renderização
  const displayContent = isEditing ? localContent : content
  const displayFontFamily = isEditing ? localFontFamily : fontFamily
  const displayColor = isEditing ? localColor : color

  const style: React.CSSProperties = {
    fontFamily: displayFontFamily || undefined,
    color: displayColor || undefined,
    fontSize: fontSize || undefined,
    fontWeight: fontWeight || undefined,
    lineHeight: lineHeight || undefined,
    letterSpacing: letterSpacing || undefined,
  }

  const baseClasses = `${className} ${isSelected && isInEditor ? 'ring-2 ring-blue-500 ring-offset-2' : ''} ${isHovered && isInEditor ? 'ring-1 ring-blue-300' : ''}`

  // Ref para o modal - sempre declarado (regra dos hooks)
  const modalRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Bloquear qualquer evento que possa fechar o modal
  useEffect(() => {
    if (!isEditing || !isInEditor || !mounted) return

    const handleAnyClick = (e: MouseEvent) => {
      // Se o clique foi dentro do modal, não fazer nada
      if (modalRef.current?.contains(e.target as Node)) {
        return
      }
      // Se o clique foi fora, também não fazer nada - modal só fecha com botões
      // Não fazer nada aqui - deixar apenas os botões fecharem
    }

    const handleAnyKeyDown = (e: KeyboardEvent) => {
      // Permitir apenas ESC para fechar
      if (e.key === 'Escape' && modalRef.current?.contains(document.activeElement)) {
        return // ESC já é tratado pelo handleKeyDown
      }
    }

    // Não adicionar listeners - deixar apenas os botões controlarem o fechamento
    return () => {
      // Cleanup não necessário
    }
  }, [isEditing, isInEditor, mounted])

  if (isEditing && isInEditor && mounted) {
    const modalContent = (
      <>
        {/* Overlay de fundo - apenas visual */}
        <div 
          className="fixed inset-0 z-[9998] bg-black/20"
          style={{ pointerEvents: 'none' }}
        />
        {/* Modal */}
        <div
          ref={modalRef}
          className={`${baseClasses} fixed z-[9999] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2`}
          style={style}
          onKeyDown={handleKeyDown}
          onClick={(e) => {
            // Bloquear qualquer propagação
            e.stopPropagation()
            e.nativeEvent.stopImmediatePropagation()
          }}
          onMouseDown={(e) => {
            // Bloquear qualquer propagação
            e.stopPropagation()
            e.nativeEvent.stopImmediatePropagation()
          }}
        >
          <div className="min-w-[320px] max-w-[500px] bg-white rounded-lg shadow-2xl border-2 border-blue-500 p-4 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900">Editar Texto</h3>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  e.preventDefault()
                  handleCancel()
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Fechar"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
              Conteúdo
            </label>
            <textarea
              value={localContent}
              onChange={(e) => setLocalContent(e.target.value)}
              onKeyDown={handleTextareaKeyDown}
              className="w-full px-3 py-2.5 text-sm text-gray-900 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all placeholder:text-gray-400"
              rows={4}
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                Fonte
              </label>
              <select
                value={localFontFamily}
                onChange={(e) => setLocalFontFamily(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-all"
              >
                <option value="">Padrão</option>
                <option value="var(--font-display)">Cormorant Garamond (Display)</option>
                <option value="var(--font-body)">Montserrat (Body)</option>
                <option value="'Cormorant Garamond', Georgia, serif">Cormorant Garamond</option>
                <option value="'Montserrat', system-ui, sans-serif">Montserrat</option>
                <option value="Arial, sans-serif">Arial</option>
                <option value="Georgia, serif">Georgia</option>
                <option value="'Times New Roman', serif">Times New Roman</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                Cor
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={localColor || '#000000'}
                  onChange={(e) => setLocalColor(e.target.value)}
                  className="w-10 h-10 border-2 border-gray-300 rounded-md cursor-pointer hover:border-blue-500 transition-colors"
                />
                <select
                  value={localColor}
                  onChange={(e) => setLocalColor(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-all"
                >
                  <option value="">Padrão</option>
                  <option value="hsl(var(--foreground))">Foreground</option>
                  <option value="hsl(var(--secondary-foreground))">Secondary</option>
                  <option value="hsl(var(--gold))">Gold</option>
                  <option value="hsl(var(--wine))">Wine</option>
                  <option value="hsl(var(--charcoal))">Charcoal</option>
                  <option value="hsl(var(--primary))">Primary</option>
                  <option value="#000000">Preto</option>
                  <option value="#ffffff">Branco</option>
                  <option value="#666666">Cinza</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs font-mono">Ctrl+Enter</kbd> para salvar
            </p>
            <div className="flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  e.preventDefault()
                  handleCancel()
                }}
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
                className="px-4 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors shadow-sm"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      </div>
      </>
    )

    // Renderizar usando portal para isolar completamente do Craft.js
    return typeof document !== 'undefined' 
      ? createPortal(modalContent, document.body)
      : null
  }

  const Tag = tag as keyof JSX.IntrinsicElements
  
  // IMPORTANTE: Para que o Craft.js crie um nó filho para o EditableText dentro de um canvas,
  // precisamos usar connect() e drag() corretamente. O padrão correto é connect(drag(ref)).
  // Isso garante que cada EditableText seja registrado como um nó filho separado no canvas pai.
  const elementRef = (ref: HTMLElement | null) => {
    if (ref && isInEditor && nodeConnectors) {
      // CRÍTICO: O padrão correto do Craft.js é connect(drag(ref))
      // Isso cria um nó filho no canvas pai e permite que cada EditableText tenha seu próprio nó
      if (nodeConnectors.connect && nodeConnectors.drag) {
        // connect() cria o nó, drag() permite arrastar
        // A ordem é importante: primeiro drag(), depois connect()
        nodeConnectors.connect(nodeConnectors.drag(ref))
      } else if (nodeConnectors.connect) {
        // Fallback se drag não estiver disponível
        nodeConnectors.connect(ref)
      }
    }
  }
  
  return React.createElement(
    Tag,
    {
      ref: elementRef,
      className: `${baseClasses} ${isSelected && isInEditor ? 'cursor-text' : ''}`,
      style,
      onDoubleClick: handleDoubleClick,
      title: isSelected && isInEditor ? 'Duplo clique para editar' : '',
    },
    displayContent
  )
}

EditableText.craft = {
  displayName: 'Texto Editável',
  props: {
    content: '',
    fontFamily: '',
    color: '',
    id: '', // ID único para identificar este EditableText no layout JSON
  },
  related: {
    settings: EditableTextSettings,
  },
}

function EditableTextSettings() {
  let nodeData: {
    actions: { setProp: (callback: (props: EditableTextProps) => void) => void }
    props: EditableTextProps
  } | null = null

  try {
    const node = useNode((node) => ({
      props: node.data.props as EditableTextProps,
    }))
    nodeData = {
      actions: node.actions,
      props: node.props,
    }
  } catch {
    return null
  }

  const { actions: { setProp }, props } = nodeData

  return (
    <div className="space-y-4 p-4">
      <div>
        <label className="block text-sm font-medium mb-2">Conteúdo</label>
        <textarea
          value={props.content || ''}
          onChange={(e) => setProp((props: EditableTextProps) => (props.content = e.target.value))}
          className="w-full px-3 py-2 border rounded resize-none"
          rows={4}
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Fonte</label>
        <select
          value={props.fontFamily || ''}
          onChange={(e) => setProp((props: EditableTextProps) => (props.fontFamily = e.target.value))}
          className="w-full px-3 py-2 border rounded"
        >
          <option value="">Padrão</option>
          <option value="var(--font-display)">Cormorant Garamond (Display)</option>
          <option value="var(--font-body)">Montserrat (Body)</option>
          <option value="'Cormorant Garamond', Georgia, serif">Cormorant Garamond</option>
          <option value="'Montserrat', system-ui, sans-serif">Montserrat</option>
          <option value="Arial, sans-serif">Arial</option>
          <option value="Georgia, serif">Georgia</option>
          <option value="'Times New Roman', serif">Times New Roman</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Cor</label>
        <div className="flex gap-2">
          <input
            type="color"
            value={props.color || '#000000'}
            onChange={(e) => setProp((props: EditableTextProps) => (props.color = e.target.value))}
            className="w-12 h-10 border rounded cursor-pointer"
          />
          <select
            value={props.color || ''}
            onChange={(e) => setProp((props: EditableTextProps) => (props.color = e.target.value))}
            className="flex-1 px-3 py-2 border rounded"
          >
            <option value="">Padrão</option>
            <option value="hsl(var(--foreground))">Foreground</option>
            <option value="hsl(var(--secondary-foreground))">Secondary</option>
            <option value="hsl(var(--gold))">Gold</option>
            <option value="hsl(var(--wine))">Wine</option>
            <option value="hsl(var(--charcoal))">Charcoal</option>
            <option value="hsl(var(--primary))">Primary</option>
            <option value="#000000">Preto</option>
            <option value="#ffffff">Branco</option>
            <option value="#666666">Cinza</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Tamanho da Fonte</label>
        <input
          type="text"
          value={props.fontSize || ''}
          onChange={(e) => setProp((props: EditableTextProps) => (props.fontSize = e.target.value))}
          placeholder="ex: 1.5rem, 24px, 2em"
          className="w-full px-3 py-2 border rounded"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Peso da Fonte</label>
        <select
          value={props.fontWeight || ''}
          onChange={(e) => setProp((props: EditableTextProps) => (props.fontWeight = e.target.value))}
          className="w-full px-3 py-2 border rounded"
        >
          <option value="">Padrão</option>
          <option value="300">Light</option>
          <option value="400">Normal</option>
          <option value="500">Medium</option>
          <option value="600">Semi Bold</option>
          <option value="700">Bold</option>
        </select>
      </div>
    </div>
  )
}
