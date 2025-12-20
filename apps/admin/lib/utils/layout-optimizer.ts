/**
 * Otimizador de Layout do Craft.js
 * 
 * Remove campos desnecessários do layout antes de salvar,
 * reduzindo o tamanho do payload sem quebrar a funcionalidade.
 * 
 * Campos removidos:
 * - displayName (apenas para UI do editor)
 * - custom vazio ou com valores padrão
 * - hidden quando false (padrão)
 * - isCanvas quando pode ser inferido
 * - Campos undefined/null vazios
 */

interface CraftNode {
  type?: {
    resolvedName?: string
  }
  props?: Record<string, unknown>
  nodes?: string[]
  linkedNodes?: Record<string, string>
  parent?: string
  displayName?: string
  custom?: Record<string, unknown>
  hidden?: boolean
  isCanvas?: boolean
  [key: string]: unknown
}

interface CraftLayout {
  ROOT?: CraftNode
  [nodeId: string]: CraftNode | undefined
}

/**
 * Otimiza um nó removendo campos desnecessários
 * Mantém apenas campos essenciais para renderização
 */
function optimizeNode(node: CraftNode, nodeId: string): CraftNode {
  const optimized: CraftNode = {}

  // type é essencial - sempre manter
  if (node.type) {
    optimized.type = node.type
  }

  // props é essencial - sempre manter (mesmo que vazio)
  if (node.props !== undefined) {
    optimized.props = node.props
  }

  // nodes é essencial - sempre manter (mesmo que vazio)
  if (node.nodes !== undefined) {
    optimized.nodes = node.nodes
  }

  // linkedNodes é essencial - sempre manter se existir
  if (node.linkedNodes && Object.keys(node.linkedNodes).length > 0) {
    optimized.linkedNodes = node.linkedNodes
  }

  // parent é essencial - sempre manter (exceto para ROOT)
  if (node.parent !== undefined && nodeId !== 'ROOT') {
    optimized.parent = node.parent
  }

  // displayName - remover (apenas para UI do editor, não usado na renderização)
  // Não adicionar ao optimized

  // custom - manter apenas se tiver conteúdo útil
  if (node.custom && Object.keys(node.custom).length > 0) {
    // Verificar se custom tem valores não-vazios
    const hasUsefulCustom = Object.values(node.custom).some(
      (value) => value !== null && value !== undefined && value !== ''
    )
    if (hasUsefulCustom) {
      optimized.custom = node.custom
    }
  }

  // hidden - manter apenas se true (false é o padrão)
  if (node.hidden === true) {
    optimized.hidden = true
  }

  // isCanvas - manter apenas se true (false é o padrão para a maioria dos nós)
  // Mas para ROOT sempre é true, então podemos inferir
  if (node.isCanvas === true && nodeId !== 'ROOT') {
    optimized.isCanvas = true
  }

  return optimized
}

/**
 * Otimiza um layout completo removendo campos desnecessários
 * Mantém compatibilidade total com Craft.js
 */
export function optimizeLayout(layout: Record<string, unknown>): Record<string, unknown> {
  if (!layout || typeof layout !== 'object' || Array.isArray(layout)) {
    return layout
  }

  const craftLayout = layout as CraftLayout
  const optimized: CraftLayout = {}

  // Otimizar cada nó
  for (const [nodeId, node] of Object.entries(craftLayout)) {
    if (!node || typeof node !== 'object') {
      continue
    }

    optimized[nodeId] = optimizeNode(node as CraftNode, nodeId)
  }

  return optimized
}

/**
 * Calcula a redução de tamanho após otimização
 */
export function getOptimizationStats(
  original: Record<string, unknown>,
  optimized: Record<string, unknown>
): {
  originalSize: number
  optimizedSize: number
  reduction: number
  reductionPercent: number
} {
  const originalJson = JSON.stringify(original)
  const optimizedJson = JSON.stringify(optimized)
  
  const originalSize = originalJson.length
  const optimizedSize = optimizedJson.length
  const reduction = originalSize - optimizedSize
  const reductionPercent = originalSize > 0 ? (reduction / originalSize) * 100 : 0

  return {
    originalSize,
    optimizedSize,
    reduction,
    reductionPercent: Math.round(reductionPercent * 100) / 100
  }
}

