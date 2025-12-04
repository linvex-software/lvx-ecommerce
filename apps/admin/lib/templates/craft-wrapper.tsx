/**
 * Wrapper para componentes do template funcionarem com Craft.js
 * 
 * Adiciona apenas o mínimo necessário para o Craft.js processar os componentes
 */

import React from 'react'
import { useNode } from '@craftjs/core'

/**
 * Wrapper genérico que adiciona suporte básico ao Craft.js
 */
export function withCraftSupport<T extends Record<string, any>>(
  Component: React.ComponentType<T>
): React.ComponentType<T> {
  const CraftComponent = (props: T) => {
    const { connectors: { connect, drag } } = useNode()
    
    return (
      <div ref={(ref: HTMLDivElement | null) => connect(drag(ref))}>
        <Component {...props} />
      </div>
    )
  }
  
  CraftComponent.displayName = `Craft(${Component.displayName || Component.name || 'Component'})`
  
  return CraftComponent
}



