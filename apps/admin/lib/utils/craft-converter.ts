/**
 * Utilitários para converter entre Craft.js JSON e formato Block
 */

import type { Block } from '@/components/blocks/types'

interface CraftNode {
  type: {
    resolvedName: string
  }
  props: Record<string, unknown>
  nodes?: string[]
  displayName?: string
}

interface CraftJSON {
  ROOT?: {
    type: {
      resolvedName: string
    }
    nodes?: string[]
    props?: Record<string, unknown>
  }
  [key: string]: CraftNode | undefined | {
    type: {
      resolvedName: string
    }
    nodes?: string[]
    props?: Record<string, unknown>
  }
}

/**
 * Converte JSON do Craft.js para formato Block[]
 */
export function craftJsonToBlocks(craftJson: string): Block[] {
  try {
    const parsed = JSON.parse(craftJson) as CraftJSON
    const blocks: Block[] = []

    if (!parsed.ROOT || !parsed.ROOT.nodes) {
      return []
    }

    // Percorrer os nós do ROOT
    parsed.ROOT.nodes.forEach((nodeId, index) => {
      const node = parsed[nodeId]
      if (!node) return

      // Mapear resolvedName para tipo de bloco
      const typeMap: Record<string, Block['type']> = {
        HeroBlockCraft: 'hero',
        ProductsBlockCraft: 'products',
        CategoriesBlockCraft: 'categories',
        BannerBlockCraft: 'banner',
        TextBlockCraft: 'text',
        ImageBlockCraft: 'image',
      }

      const blockType = typeMap[node.type.resolvedName]
      if (!blockType) return

      blocks.push({
        type: blockType,
        enabled: true,
        order: index,
        props: node.props || {},
      })
    })

    return blocks
  } catch (error) {
    console.error('Erro ao converter Craft JSON:', error)
    return []
  }
}

/**
 * Converte Block[] para JSON do Craft.js
 * O ROOT precisa ter um filho canvas (div) que contém os blocos
 */
export function blocksToCraftJson(blocks: Block[]): string {
  const enabledBlocks = blocks
    .filter(block => block.enabled)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

  console.log('[craft-converter] Convertendo blocos:', enabledBlocks.length, enabledBlocks.map(b => b.type))

  // Criar um container canvas que será o filho do ROOT
  const canvasNodeId = 'canvas-container'

  const craftJson: CraftJSON = {
    ROOT: {
      type: {
        resolvedName: 'div',
      },
      nodes: [canvasNodeId], // ROOT tem um filho: o canvas container
      props: {},
    },
    [canvasNodeId]: {
      type: {
        resolvedName: 'div',
      },
      nodes: [], // Os blocos serão filhos do canvas
      props: {},
    },
  }

  enabledBlocks.forEach((block, index) => {
    const nodeId = `block-${block.type}-${index}`

    // Mapear tipo de bloco para resolvedName
    const resolvedNameMap: Record<Block['type'], string> = {
      hero: 'HeroBlockCraft',
      products: 'ProductsBlockCraft',
      categories: 'CategoriesBlockCraft',
      banner: 'BannerBlockCraft',
      text: 'TextBlockCraft',
      image: 'ImageBlockCraft',
    }

    const resolvedName = resolvedNameMap[block.type]
    if (!resolvedName) {
      console.warn('[craft-converter] Tipo de bloco desconhecido:', block.type)
      return
    }

    craftJson[nodeId] = {
      type: {
        resolvedName: resolvedName,
      },
      props: block.props || {},
      displayName: resolvedName,
    }

    // Adicionar o bloco como filho do canvas container
    if (!craftJson[canvasNodeId]!.nodes) {
      craftJson[canvasNodeId]!.nodes = []
    }
    craftJson[canvasNodeId]!.nodes!.push(nodeId)
  })

  const jsonString = JSON.stringify(craftJson)
  console.log('[craft-converter] JSON gerado:', jsonString.substring(0, 500))
  return jsonString
}

