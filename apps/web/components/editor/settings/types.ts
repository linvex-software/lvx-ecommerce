// Tipos compartilhados para configurações de componentes (Web)

export interface ColorConfig {
  type: 'custom' | 'theme'
  value: string // hex color ou nome do tema (primary, secondary, etc)
  opacity?: number // 0-100
}

export interface TypographyConfig {
  fontSize?: number | { mobile?: number; tablet?: number; desktop?: number }
  fontWeight?: '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900'
  fontFamily?: string
  lineHeight?: number | string
  letterSpacing?: number | string
  textAlign?: 'left' | 'center' | 'right' | 'justify'
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize'
}

export interface SpacingConfig {
  padding?: number | { top?: number; right?: number; bottom?: number; left?: number }
  margin?: number | { top?: number; right?: number; bottom?: number; left?: number }
}

export interface BorderConfig {
  width?: number
  radius?: number
  color?: ColorConfig
  style?: 'solid' | 'dashed' | 'dotted' | 'none'
}

export interface ShadowConfig {
  enabled?: boolean
  x?: number
  y?: number
  blur?: number
  spread?: number
  color?: string
}

export interface ImageConfig {
  url?: string
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down'
  position?: string
  aspectRatio?: string
  borderRadius?: number
  shadow?: ShadowConfig
  filters?: {
    brightness?: number // 0-200
    contrast?: number // 0-200
    grayscale?: number // 0-100
    blur?: number // 0-20
  }
}

export interface ResponsiveConfig<T> {
  mobile?: T
  tablet?: T
  desktop?: T
}

export interface BackgroundConfig {
  type: 'color' | 'gradient' | 'image' | 'none'
  color?: ColorConfig
  gradient?: {
    direction?: number // 0-360
    colors?: Array<{ color: string; stop: number }>
  }
  image?: ImageConfig
  opacity?: number // 0-100
}

export interface LayoutConfig {
  display?: 'flex' | 'grid' | 'block'
  direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse'
  gap?: number
  alignItems?: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline'
  justifyContent?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly'
  maxWidth?: number | string
  width?: number | string
  height?: number | string
  position?: 'static' | 'relative' | 'absolute' | 'fixed' | 'sticky'
}

export const THEME_COLORS = {
  primary: 'var(--store-primary-color, #000000)',
  secondary: 'var(--store-secondary-color, #6366F1)',
  text: 'var(--store-text-color, #000000)',
  icon: 'var(--store-icon-color, #000000)',
  neutral: '#6B7280',
  danger: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
  info: '#3B82F6'
} as const

export type ThemeColorName = keyof typeof THEME_COLORS




