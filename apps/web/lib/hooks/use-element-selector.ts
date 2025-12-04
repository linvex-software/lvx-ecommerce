/**
 * Hook para seleção de elementos no preview (iframe)
 */

import { useEffect, useState, useCallback } from 'react'
import { findElementByBuilderId } from '../utils/builder-id'

export interface SelectedElement {
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

export function useElementSelector(isEnabled: boolean, onSelect?: (element: SelectedElement) => void) {
  const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null)
  const [hoveredElement, setHoveredElement] = useState<HTMLElement | null>(null)

  const getElementInfo = useCallback((element: HTMLElement): SelectedElement | null => {
    const builderId = element.dataset.builderId
    if (!builderId) return null

    const computedStyle = window.getComputedStyle(element)
    const rect = element.getBoundingClientRect()

    // Extrair estilos relevantes
    const styles: Record<string, string> = {
      color: computedStyle.color,
      backgroundColor: computedStyle.backgroundColor,
      fontSize: computedStyle.fontSize,
      fontWeight: computedStyle.fontWeight,
      fontFamily: computedStyle.fontFamily,
      lineHeight: computedStyle.lineHeight,
      letterSpacing: computedStyle.letterSpacing,
      textAlign: computedStyle.textAlign,
      marginTop: computedStyle.marginTop,
      marginBottom: computedStyle.marginBottom,
      marginLeft: computedStyle.marginLeft,
      marginRight: computedStyle.marginRight,
      paddingTop: computedStyle.paddingTop,
      paddingBottom: computedStyle.paddingBottom,
      paddingLeft: computedStyle.paddingLeft,
      paddingRight: computedStyle.paddingRight,
      border: computedStyle.border,
      borderWidth: computedStyle.borderWidth,
      borderStyle: computedStyle.borderStyle,
      borderColor: computedStyle.borderColor,
      borderRadius: computedStyle.borderRadius,
      width: computedStyle.width,
      height: computedStyle.height,
      display: computedStyle.display,
      justifyContent: computedStyle.justifyContent,
      alignItems: computedStyle.alignItems,
    }

    // Extrair props do elemento
    const props: Record<string, unknown> = {
      tag: element.tagName.toLowerCase(),
      textContent: element.textContent || '',
      innerHTML: element.innerHTML,
    }

    // Props específicas por tipo
    if (element instanceof HTMLImageElement) {
      props.src = element.src
      props.alt = element.alt
      props.width = element.width
      props.height = element.height
    }

    if (element instanceof HTMLAnchorElement || element instanceof HTMLButtonElement) {
      props.href = (element as HTMLAnchorElement).href || ''
      props.target = (element as HTMLAnchorElement).target || ''
    }

    return {
      id: builderId,
      tag: element.tagName.toLowerCase(),
      props,
      styles,
      bounds: {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      },
    }
  }, [])

  useEffect(() => {
    console.log('[ElementSelector] Hook enabled:', isEnabled)
    if (!isEnabled) {
      setHoveredElement(null)
      setSelectedElement(null)
      return
    }

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target) return

      // Ignorar elementos do próprio sistema de seleção
      if (target.closest('[data-builder-overlay]')) return

      const builderId = target.dataset.builderId || target.closest('[data-builder-id]')?.getAttribute('data-builder-id')
      if (builderId) {
        setHoveredElement(target)
      }
    }

    const handleMouseOut = () => {
      setHoveredElement(null)
    }

    const handleClick = (e: MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()

      const target = e.target as HTMLElement
      if (!target) {
        console.log('[ElementSelector] No target element')
        return
      }

      // Buscar o elemento com data-builder-id (no próprio elemento ou no pai)
      let elementWithId: HTMLElement | null = target
      let builderId: string | null = null

      // Primeiro verifica o próprio elemento
      if (target.dataset.builderId) {
        builderId = target.dataset.builderId
      } else {
        // Busca no elemento pai mais próximo
        elementWithId = target.closest('[data-builder-id]') as HTMLElement | null
        if (elementWithId) {
          builderId = elementWithId.dataset.builderId || null
        }
      }

      console.log('[ElementSelector] Click detected:', {
        target: target.tagName,
        builderId,
        elementWithId: elementWithId?.tagName,
        allDataAttributes: Array.from(target.attributes)
          .filter(attr => attr.name.startsWith('data-'))
          .map(attr => ({ name: attr.name, value: attr.value }))
      })

      if (builderId && elementWithId) {
        const info = getElementInfo(elementWithId)
        if (info) {
          console.log('[ElementSelector] Element info:', info)
          setSelectedElement(info)
          onSelect?.(info)
          
          // Notificar o parent (admin)
          if (window.parent) {
            console.log('[ElementSelector] Sending postMessage to parent')
            window.parent.postMessage({
              action: 'SELECTED_ELEMENT',
              elementId: info.id,
              props: info.props,
              styles: info.styles,
              bounds: info.bounds,
            }, '*')
          }
        } else {
          console.log('[ElementSelector] Failed to get element info')
        }
      } else {
        console.log('[ElementSelector] No builder ID found on element or parent')
      }
    }

    document.addEventListener('mouseover', handleMouseOver)
    document.addEventListener('mouseout', handleMouseOut)
    document.addEventListener('click', handleClick, true)

    // Mudar cursor
    document.body.style.cursor = 'crosshair'

    return () => {
      document.removeEventListener('mouseover', handleMouseOver)
      document.removeEventListener('mouseout', handleMouseOut)
      document.removeEventListener('click', handleClick, true)
      document.body.style.cursor = ''
    }
  }, [isEnabled, getElementInfo, onSelect])

  // Renderizar overlays
  useEffect(() => {
    if (!isEnabled) {
      // Remover overlays existentes
      document.querySelectorAll('[data-builder-overlay]').forEach(el => el.remove())
      return
    }

    const createOverlay = (element: HTMLElement, type: 'hover' | 'selected') => {
      const existing = document.querySelector(`[data-builder-overlay="${type}"]`)
      if (existing) existing.remove()

      const rect = element.getBoundingClientRect()
      const overlay = document.createElement('div')
      overlay.setAttribute('data-builder-overlay', type)
      overlay.style.position = 'fixed'
      overlay.style.top = `${rect.top + window.scrollY}px`
      overlay.style.left = `${rect.left + window.scrollX}px`
      overlay.style.width = `${rect.width}px`
      overlay.style.height = `${rect.height}px`
      overlay.style.pointerEvents = 'none'
      overlay.style.zIndex = '999999'
      overlay.style.border = type === 'selected' ? '2px solid #4A90E2' : '2px solid #4A90E2'
      overlay.style.backgroundColor = type === 'selected' ? 'rgba(74, 144, 226, 0.1)' : 'rgba(74, 144, 226, 0.05)'
      overlay.style.borderRadius = '2px'
      overlay.style.boxSizing = 'border-box'

      // Mostrar dimensões
      const label = document.createElement('div')
      label.style.position = 'absolute'
      label.style.top = '-24px'
      label.style.left = '0'
      label.style.background = '#4A90E2'
      label.style.color = 'white'
      label.style.padding = '2px 6px'
      label.style.fontSize = '11px'
      label.style.fontFamily = 'monospace'
      label.style.borderRadius = '2px'
      label.style.whiteSpace = 'nowrap'
      label.textContent = `${Math.round(rect.width)} × ${Math.round(rect.height)}`
      overlay.appendChild(label)

      document.body.appendChild(overlay)
    }

    if (hoveredElement && !selectedElement) {
      createOverlay(hoveredElement, 'hover')
    }

    if (selectedElement) {
      const element = findElementByBuilderId(selectedElement.id)
      if (element) {
        createOverlay(element, 'selected')
      }
    }

    return () => {
      document.querySelectorAll('[data-builder-overlay]').forEach(el => el.remove())
    }
  }, [isEnabled, hoveredElement, selectedElement])

  return { selectedElement, hoveredElement }
}

