/**
 * Safe hook to use Craft.js useNode only when inside Editor context
 * Returns a no-op connector when not in Craft.js context
 */

import { useNode } from '@craftjs/core'
import { useMemo } from 'react'

/**
 * Returns a safe connector that only works when inside Craft.js Editor context
 */
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

