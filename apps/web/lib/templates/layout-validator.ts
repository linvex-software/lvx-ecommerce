/**
 * Validador e Limpador de Layout do Craft.js
 * 
 * Garante que apenas componentes válidos sejam desserializados,
 * prevenindo erros de "Cannot find component <undefined /> in resolver map"
 */

// Verificar se estamos em modo desenvolvimento
const isDev = typeof process !== 'undefined' && process.env.NODE_ENV === 'development'

interface CraftNode {
  type?: {
    resolvedName?: string
  }
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
 */
function isValidComponent(
  resolvedName: string | undefined | null,
  resolver: Record<string, any>
): boolean {
  if (!resolvedName) return false
  return resolvedName in resolver
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

  const resolvedName = node.type?.resolvedName

  // Se não tem resolvedName, pode ser um elemento HTML nativo ou ROOT
  // ROOT e elementos HTML nativos (div, span, etc.) devem ser preservados
  if (!resolvedName) {
    // Se for ROOT ou um elemento que não precisa de resolvedName, preservar
    if (nodeId === 'ROOT') {
      return node
    }
    // Para outros nós sem resolvedName, verificar se é um elemento HTML válido
    // Por enquanto, preservar todos os nós sem resolvedName
    return node
  }

  // Se o componente não existe no resolver, retornar null
  if (!isValidComponent(resolvedName, resolver)) {
    // Log apenas em desenvolvimento e uma vez por componente único para evitar spam
    if (isDev && !visited.has(`warn_${resolvedName}`)) {
      console.warn(
        `[LayoutValidator] Componente inválido removido: "${resolvedName}" (não encontrado no resolver)`
      )
      visited.add(`warn_${resolvedName}`)
    }
    return null
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

  // Se o resolver estiver vazio, retornar o layout original sem validação
  // Isso evita remover todos os nós quando o resolver ainda não foi carregado
  const resolverKeys = Object.keys(resolver)
  if (resolverKeys.length === 0) {
    if (isDev) {
      console.warn('[LayoutValidator] Resolver vazio - retornando layout original sem validação')
    }
    return craftLayout
  }

  // Coletar todos os tipos únicos de componentes no layout
  const componentTypes = new Set<string>()
  const collectTypes = (nodeId: string, node: CraftNode | undefined, visited: Set<string> = new Set()) => {
    if (!node || visited.has(nodeId)) return
    visited.add(nodeId)
    
    if (node.type?.resolvedName) {
      componentTypes.add(node.type.resolvedName)
    }
    
    if (node.nodes) {
      for (const childId of node.nodes) {
        collectTypes(childId, craftLayout[childId], visited)
      }
    }
  }
  
  collectTypes('ROOT', craftLayout.ROOT)
  
  // Verificar quais componentes do layout estão no resolver
  const missingComponents = Array.from(componentTypes).filter(type => !(type in resolver))
  
  // Se muitos componentes estão faltando, pode ser que o resolver não foi carregado corretamente
  // Se TODOS os componentes do layout estão faltando, retornar o layout original
  if (missingComponents.length > 0 && missingComponents.length === componentTypes.size) {
    if (isDev) {
      console.warn('[LayoutValidator] NENHUM componente do layout está no resolver! Retornando layout original.')
    }
    return craftLayout
  }
  
  // Se a maioria dos componentes está faltando (>80%), também retornar o layout original
  const missingPercentage = componentTypes.size > 0 
    ? (missingComponents.length / componentTypes.size) * 100 
    : 0
  if (missingPercentage > 80) {
    if (isDev) {
      console.warn(`[LayoutValidator] ${missingPercentage.toFixed(0)}% dos componentes estão faltando no resolver! Retornando layout original.`)
    }
    return craftLayout
  }

  // Limpar o layout recursivamente
  const cleanedLayout: CraftLayout = {}
  const visited = new Set<string>()

  // Limpar ROOT primeiro
  const cleanedRoot = cleanNode('ROOT', craftLayout.ROOT, craftLayout, resolver, visited)
  if (!cleanedRoot) {
    // Se ROOT ficou inválido após limpeza, criar um novo
    if (isDev) {
      console.warn('[LayoutValidator] ROOT inválido após limpeza, usando layout padrão')
    }
    return createSafeDefaultLayout()
  }

  cleanedLayout.ROOT = cleanedRoot

  // Limpar todos os outros nós
  // IMPORTANTE: Preservar TODOS os nós referenciados, mesmo que não estejam em ROOT.nodes
  // porque podem ser linkedNodes
  for (const [nodeId, node] of Object.entries(craftLayout)) {
    if (nodeId === 'ROOT') continue
    
    const cleanedNode = cleanNode(nodeId, node, craftLayout, resolver, visited)
    if (cleanedNode) {
      cleanedLayout[nodeId] = cleanedNode
    }
    // Removido log de nós removidos - não é necessário em produção
  }

  // Verificar se o layout limpo ainda tem conteúdo válido
  if (!cleanedLayout.ROOT || Object.keys(cleanedLayout).length === 0) {
    if (isDev) {
      console.warn('[LayoutValidator] Layout vazio após limpeza, usando layout padrão')
    }
    return createSafeDefaultLayout()
  }

  // Verificar se ROOT tem nós válidos
  const validRootNodes = cleanedLayout.ROOT.nodes?.filter(nodeId => cleanedLayout[nodeId]) || []
  
  // Se TODOS os nós do ROOT foram removidos, pode ser que o resolver não tenha os componentes
  // Nesse caso, retornar o layout original em vez de um layout vazio
  if (validRootNodes.length === 0 && cleanedLayout.ROOT.nodes && cleanedLayout.ROOT.nodes.length > 0) {
    if (isDev) {
      console.warn('[LayoutValidator] Todos os nós do ROOT foram removidos! Retornando layout original.')
    }
    return craftLayout
  }
  
  if (validRootNodes.length !== cleanedLayout.ROOT.nodes?.length) {
    // Silenciosamente ajustar os nós do ROOT sem log
    cleanedLayout.ROOT.nodes = validRootNodes
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

