import * as fs from 'fs'
import * as path from 'path'

/**
 * Gera o layout padrão da loja usando o template flor-de-menina
 * 
 * Carrega o layout completo do template flor-de-menina como padrão
 * para todas as novas lojas criadas.
 */
export function generateDefaultLayout(): Record<string, unknown> {
  try {
    // Caminho para o layout do template
    // Usar process.cwd() que aponta para a raiz do projeto (onde está o package.json raiz)
    const projectRoot = process.cwd()
    const templateLayoutPath = path.join(
      projectRoot,
      'templates',
      'flor-de-menina',
      'layout.json'
    )

    // Verificar se o arquivo existe
    if (!fs.existsSync(templateLayoutPath)) {
      console.warn(
        `[generateDefaultLayout] Arquivo de layout não encontrado em ${templateLayoutPath}. Usando layout mínimo.`
      )
      return createMinimalLayout()
    }

    // Ler e parsear o arquivo JSON
    const layoutContent = fs.readFileSync(templateLayoutPath, 'utf-8')
    const layout = JSON.parse(layoutContent) as Record<string, unknown>

    // Validar que o layout tem ROOT
    if (!layout || !layout.ROOT) {
      console.warn(
        '[generateDefaultLayout] Layout do template não tem ROOT válido. Usando layout mínimo.'
      )
      return createMinimalLayout()
    }

    console.log('[generateDefaultLayout] Layout do template flor-de-menina carregado com sucesso:', {
      hasRoot: !!layout.ROOT,
      totalNodes: Object.keys(layout).length,
      rootNodes: (layout.ROOT as any)?.nodes?.length || 0
    })

    return layout
  } catch (error) {
    console.error('[generateDefaultLayout] Erro ao carregar layout do template:', error)
    // Em caso de erro, retornar layout mínimo válido
    return createMinimalLayout()
  }
}

/**
 * Cria um layout mínimo válido caso o template não possa ser carregado
 */
function createMinimalLayout(): Record<string, unknown> {
  return {
    ROOT: {
      type: {
        resolvedName: 'div'
      },
      isCanvas: true,
      props: {},
      displayName: 'div',
      custom: {},
      parent: null,
      nodes: [],
      linkedNodes: {}
    }
  }
}

