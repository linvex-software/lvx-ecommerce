/**
 * Hook seguro para usar useNode do Craft.js
 * 
 * Retorna um objeto vazio se não estiver dentro do contexto do Editor
 * 
 * IMPORTANTE: Este hook sempre chama useNode() para manter a ordem dos hooks consistente.
 * O Craft.js vai lançar um erro se não estiver no contexto, mas vamos capturar isso.
 */

import { useNode } from '@craftjs/core'
import { useMemo } from 'react'

export function useSafeNode() {
  // Try to use useNode, but handle the case where it's not available
  let nodeConnectors: { connect: (ref: HTMLElement | null) => void } | null = null
  let isInEditor = false

  try {
    const { connectors } = useNode()
    isInEditor = true
    nodeConnectors = {
      connect: (ref: HTMLElement | null) => {
        if (ref) {
          connectors.connect(ref)
        }
      }
    }
  } catch {
    // Not in Craft.js context, will use no-op connector below
    isInEditor = false
  }

  // Return no-op connector if not in editor context
  const connectors = useMemo(() => {
    if (nodeConnectors) {
      return nodeConnectors
    }
    // No-op connector when not in Craft.js context
    return {
      connect: () => {} // No-op function
    }
  }, [nodeConnectors])

  return {
    connectors,
    isInEditor
  }
}

