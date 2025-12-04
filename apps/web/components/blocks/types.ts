/**
 * Tipos para o sistema de blocos dinâmicos
 */

export type BlockType = 
  | 'hero'
  | 'products'
  | 'categories'
  | 'banner'
  | 'testimonials'
  | 'faq'
  | 'newsletter'
  | 'features'

export interface ElementStyles {
  color?: string
  backgroundColor?: string
  fontSize?: string
  fontWeight?: string
  fontFamily?: string
  lineHeight?: string
  letterSpacing?: string
  textAlign?: 'left' | 'center' | 'right' | 'justify'
  marginTop?: string
  marginBottom?: string
  marginLeft?: string
  marginRight?: string
  paddingTop?: string
  paddingBottom?: string
  paddingLeft?: string
  paddingRight?: string
  border?: string
  borderWidth?: string
  borderStyle?: string
  borderColor?: string
  borderRadius?: string
  width?: string
  height?: string
  display?: string
  justifyContent?: string
  alignItems?: string
}

export interface Block {
  type: BlockType
  enabled: boolean
  order: number
  props: Record<string, unknown>
  elementStyles?: Record<string, ElementStyles> // Mapeia elementId -> estilos
}

export interface HeroBlockProps {
  title?: string
  subtitle?: string
  image?: string
  cta_text?: string
  cta_link?: string
  overlay_opacity?: number
  show_text?: boolean
  show_button?: boolean
}

export interface ProductsBlockProps {
  title?: string
  category_id?: string
  limit?: number
  show_filters?: boolean
  layout?: 'grid' | 'carousel'
}

export interface CategoriesBlockProps {
  title?: string
  limit?: number
  layout?: 'grid' | 'list'
}

export interface BannerBlockProps {
  image?: string
  title?: string
  subtitle?: string
  cta_text?: string
  cta_link?: string
  position?: 'top' | 'middle' | 'bottom'
}

export interface TestimonialsBlockProps {
  title?: string
  testimonials?: Array<{
    name: string
    text: string
    rating: number
    avatar?: string
  }>
}

export interface FAQBlockProps {
  title?: string
  items?: Array<{
    question: string
    answer: string
  }>
}

export interface NewsletterBlockProps {
  title?: string
  subtitle?: string
  placeholder?: string
}

export interface FeaturesBlockProps {
  title?: string
  features?: Array<{
    icon?: string
    title: string
    description: string
  }>
}

