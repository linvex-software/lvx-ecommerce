/**
 * Validador e Limpador de Layout do Craft.js
 * 
 * Garante que apenas componentes válidos sejam desserializados,
 * prevenindo erros de "Cannot find component <undefined /> in resolver map"
 */

interface CraftNode {
  type?: {
    resolvedName?: string
  } | string // type pode ser objeto com resolvedName OU string (elemento HTML)
  props?: Record<string, unknown>
  nodes?: string[]
  [key: string]: unknown
}

interface CraftLayout {
  ROOT?: CraftNode
  [nodeId: string]: CraftNode | undefined
}

/**
 * Valida se um componente existe no resolver
 * Tenta correspondência case-insensitive se a correspondência exata falhar
 */
function isValidComponent(
  resolvedName: string | undefined | null,
  resolver: Record<string, any>
): boolean {
  if (!resolvedName) return false
  
  // Correspondência exata
  if (resolvedName in resolver) return true
  
  // Tentar correspondência case-insensitive
  const lowerResolvedName = resolvedName.toLowerCase()
  for (const key in resolver) {
    if (key.toLowerCase() === lowerResolvedName) {
      return true
    }
  }
  
  return false
}

/**
 * Limpa um nó do layout, removendo componentes inválidos
 * Retorna o nó limpo ou null se o nó for inválido
 */
function cleanNode(
  nodeId: string,
  node: CraftNode | undefined,
  layout: CraftLayout,
  resolver: Record<string, any>,
  visited: Set<string> = new Set()
): CraftNode | null {
  if (!node) return null
  
  // Prevenir loops infinitos
  if (visited.has(nodeId)) return null
  visited.add(nodeId)

  // Extrair resolvedName - pode estar em type.resolvedName (objeto) ou type (string)
  let resolvedName: string | undefined
  if (typeof node.type === 'string') {
    // type é uma string (elemento HTML como 'div', 'span', etc.)
    // Elementos HTML básicos são sempre válidos, não precisam estar no resolver
    // Mas vamos verificar se está no resolver para componentes customizados
    const typeStr = node.type
    if (isValidComponent(typeStr, resolver)) {
      // Está no resolver, é válido
      resolvedName = typeStr
    } else {
      // Não está no resolver, mas se for elemento HTML básico, permitir
      const htmlElements = ['div', 'span', 'p', 'a', 'img', 'button', 'input', 'textarea', 'select', 'option', 'form', 'label', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'section', 'article', 'header', 'footer', 'nav', 'main', 'aside']
      if (htmlElements.includes(typeStr.toLowerCase())) {
        // É elemento HTML básico, permitir
        resolvedName = typeStr
      } else {
        // Não é elemento HTML básico e não está no resolver, remover
        if (!visited.has(`warn_${typeStr}`)) {
          console.warn(
            `[LayoutValidator] Componente inválido removido: "${typeStr}" (nó: ${nodeId}, type é string)`,
            {
              typeStr,
              resolverKeys: Object.keys(resolver).slice(0, 10)
            }
          )
          visited.add(`warn_${typeStr}`)
        }
        return null
      }
    }
  } else if (node.type && typeof node.type === 'object' && 'resolvedName' in node.type) {
    // type é objeto com resolvedName
    resolvedName = node.type.resolvedName
    if (resolvedName && !isValidComponent(resolvedName, resolver)) {
      // Log apenas uma vez por componente único para evitar spam
      if (!visited.has(`warn_${resolvedName}`)) {
        console.warn(
          `[LayoutValidator] Componente inválido removido: "${resolvedName}" (nó: ${nodeId}, type é objeto)`,
          {
            resolvedName,
            hasType: !!node.type,
            resolverKeys: Object.keys(resolver).slice(0, 10),
            nodeType: node.type
          }
        )
        visited.add(`warn_${resolvedName}`)
      }
      return null
    }
  } else if (!node.type) {
    // Sem type definido - pode ser um nó de estrutura, permitir por enquanto
    // Mas logar para debug apenas se for um nó importante
    if (nodeId.startsWith('node_') && nodeId !== 'ROOT') {
      console.warn(`[LayoutValidator] Nó ${nodeId} sem type definido, mas permitindo`)
    }
  }

  // Limpar nós filhos recursivamente
  const cleanedNodes: string[] = []
  if (node.nodes && Array.isArray(node.nodes)) {
    for (const childNodeId of node.nodes) {
      const childNode = layout[childNodeId]
      const cleanedChild = cleanNode(childNodeId, childNode, layout, resolver, visited)
      if (cleanedChild) {
        cleanedNodes.push(childNodeId)
      }
    }
  }

  // Retornar nó limpo preservando todas as propriedades do Craft.js
  const cleanedNode: CraftNode = {
    ...node,
    nodes: cleanedNodes.length > 0 ? cleanedNodes : (node.nodes || []),
  }
  
  // Preservar propriedades importantes do Craft.js que podem estar no node
  if ('isCanvas' in node) {
    (cleanedNode as any).isCanvas = node.isCanvas
  }
  if ('parent' in node) {
    (cleanedNode as any).parent = node.parent
  }
  if ('hidden' in node) {
    (cleanedNode as any).hidden = node.hidden
  }
  
  return cleanedNode
}

/**
 * Valida e limpa um layout JSON, removendo componentes inválidos
 * SEMPRE retorna um layout válido (cria um padrão se necessário)
 */
export function validateAndCleanLayout(
  layout: Record<string, unknown> | null | undefined,
  resolver: Record<string, any>
): CraftLayout {
  // Se não for um objeto válido, retornar layout padrão
  if (!layout || typeof layout !== 'object' || Array.isArray(layout)) {
    return createSafeDefaultLayout()
  }

  const craftLayout = layout as CraftLayout

  // Verificar se tem ROOT válido
  if (!craftLayout.ROOT || typeof craftLayout.ROOT !== 'object') {
    return createSafeDefaultLayout()
  }

  // Limpar o layout recursivamente
  const cleanedLayout: CraftLayout = {}
  const visited = new Set<string>()

  // Limpar ROOT primeiro
  const cleanedRoot = cleanNode('ROOT', craftLayout.ROOT, craftLayout, resolver, visited)
  if (!cleanedRoot) {
    // Se ROOT ficou inválido após limpeza, criar um novo
    console.warn('[LayoutValidator] ROOT inválido após limpeza, usando layout padrão')
    return createSafeDefaultLayout()
  }

  cleanedLayout.ROOT = cleanedRoot

  // Limpar todos os outros nós
  // IMPORTANTE: Preservar TODOS os nós referenciados, mesmo que não estejam em ROOT.nodes
  // porque podem ser linkedNodes
  for (const [nodeId, node] of Object.entries(craftLayout)) {
    if (nodeId === 'ROOT') continue
    
    // Debug: log estrutura do nó antes de limpar
    if (nodeId.startsWith('node_')) {
      const resolvedName = (node as CraftNode)?.type?.resolvedName
      if (!resolvedName || !isValidComponent(resolvedName, resolver)) {
        console.log(`[LayoutValidator] Debug nó ${nodeId}:`, {
          hasNode: !!node,
          hasType: !!(node as CraftNode)?.type,
          resolvedName,
          isValid: resolvedName ? isValidComponent(resolvedName, resolver) : false,
          resolverHasIt: resolvedName ? resolvedName in resolver : false,
          nodeType: (node as CraftNode)?.type,
          resolverKeys: Object.keys(resolver)
        })
      }
    }
    
    const cleanedNode = cleanNode(nodeId, node, craftLayout, resolver, visited)
    if (cleanedNode) {
      cleanedLayout[nodeId] = cleanedNode
    } else {
      const resolvedName = (node as CraftNode)?.type?.resolvedName
      console.warn(`[LayoutValidator] Nó ${nodeId} removido por ser inválido`, {
        resolvedName,
        hasType: !!(node as CraftNode)?.type
      })
    }
  }

  // Verificar se o layout limpo ainda tem conteúdo válido
  if (!cleanedLayout.ROOT || Object.keys(cleanedLayout).length === 0) {
    console.warn('[LayoutValidator] Layout vazio após limpeza, usando layout padrão')
    return createSafeDefaultLayout()
  }

  // Verificar se ROOT tem nós válidos
  const validRootNodes = cleanedLayout.ROOT.nodes?.filter(nodeId => cleanedLayout[nodeId]) || []
  if (validRootNodes.length !== cleanedLayout.ROOT.nodes?.length) {
    console.warn(`[LayoutValidator] Alguns nós do ROOT foram removidos: ${cleanedLayout.ROOT.nodes?.length || 0} -> ${validRootNodes.length}`)
    cleanedLayout.ROOT.nodes = validRootNodes
  }

  // Resumo final
  const originalCount = Object.keys(craftLayout).length
  const cleanedCount = Object.keys(cleanedLayout).length
  const removedCount = originalCount - cleanedCount
  const removedPercentage = (removedCount / originalCount) * 100
  
  if (removedCount > 0) {
    console.log(`[LayoutValidator] Validação concluída: ${originalCount} nós originais, ${cleanedCount} nós válidos, ${removedCount} nós removidos (${removedPercentage.toFixed(1)}%)`)
  }

  return cleanedLayout
}

/**
 * Cria um layout padrão seguro (div vazio)
 */
export function createSafeDefaultLayout(): CraftLayout {
  return {
    ROOT: {
      type: {
        resolvedName: 'div'
      },
      props: {},
      custom: {},
      displayName: 'div',
      hidden: false,
      nodes: [],
      linkedNodes: {}
    }
  }
}

/**
 * Valida se um layout é válido antes de salvar
 */
export function validateLayoutBeforeSave(
  layout: Record<string, unknown>,
  resolver: Record<string, any>
): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!layout || typeof layout !== 'object') {
    errors.push('Layout deve ser um objeto')
    return { valid: false, errors }
  }

  const craftLayout = layout as CraftLayout

  if (!craftLayout.ROOT) {
    errors.push('Layout deve ter um nó ROOT')
    return { valid: false, errors }
  }

  // Verificar todos os componentes
  const checkNode = (nodeId: string, node: CraftNode | undefined, visited: Set<string> = new Set()) => {
    if (!node || visited.has(nodeId)) return
    visited.add(nodeId)

    const resolvedName = node.type?.resolvedName
    if (resolvedName && !isValidComponent(resolvedName, resolver)) {
      errors.push(`Componente inválido: "${resolvedName}" no nó ${nodeId}`)
    }

    // Verificar nós filhos
    if (node.nodes && Array.isArray(node.nodes)) {
      for (const childNodeId of node.nodes) {
        checkNode(childNodeId, craftLayout[childNodeId], visited)
      }
    }
  }

  checkNode('ROOT', craftLayout.ROOT)

  return {
    valid: errors.length === 0,
    errors
  }
}

