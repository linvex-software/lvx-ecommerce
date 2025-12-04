/**
 * Tipos para o sistema de Templates
 * Templates são estruturas declarativas que descrevem páginas usando componentes da store
 */

export interface TemplateComponent {
  component: string // Nome do componente da store (ex: "Hero", "Banner", "ProductGrid")
  props: Record<string, unknown> // Props do componente
  children?: TemplateComponent[] // Componentes filhos (se aplicável)
}

export interface Template {
  id: string
  name: string
  description: string
  category: string // "fashion", "ecommerce", "landing", etc.
  thumbnail: string // URL da thumbnail
  structure: TemplateComponent[] // Array de componentes que compõem a página
}

export type TemplateCategory = 'fashion' | 'ecommerce' | 'landing' | 'product' | 'blog' | 'other'



