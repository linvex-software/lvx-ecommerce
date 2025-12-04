/**
 * Tipos para o sistema de blocos dinâmicos
 */
type BlockType = 
  | 'hero'
  | 'products'
  | 'categories'
  | 'banner'
  | 'testimonials'
  | 'faq'
  | 'newsletter'
  | 'features'

interface Block {
  type: BlockType
  enabled: boolean
  order: number
  props: Record<string, unknown>
  elementStyles?: Record<string, unknown>
}

/**
 * Gera o layout padrão da loja baseado na estrutura atual de /web
 * 
 * A estrutura padrão inclui:
 * 1. Bloco de produtos com filtros (equivalente à página atual)
 * 
 * O layout padrão replica a estrutura da página inicial atual:
 * - Navbar é renderizado separadamente (não é um bloco)
 * - StoreBanner é renderizado separadamente (não é um bloco)
 * - ProductsBlock com filtros habilitados (equivalente à página atual)
 */
export function generateDefaultLayout(): { blocks: Block[] } {
  const blocks: Block[] = [
    {
      type: 'products',
      enabled: true,
      order: 1,
      props: {
        title: 'Nossos Produtos',
        show_filters: true,
        limit: 8,
        layout: 'grid'
      },
      elementStyles: {}
    }
  ]

  return { blocks }
}

