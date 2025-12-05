import { ColorConfig, TypographyConfig, SpacingConfig, BorderConfig, ImageConfig, THEME_COLORS } from './types'

export function getColorValue(config: ColorConfig): string {
  if (config.type === 'theme') {
    return THEME_COLORS[config.value as keyof typeof THEME_COLORS] || config.value
  }
  return config.value
}

export function getColorWithOpacity(config: ColorConfig): string {
  const color = getColorValue(config)
  const opacity = config.opacity ?? 100
  
  if (opacity === 100) return color
  
  // Converter hex para rgba
  if (color.startsWith('#')) {
    const r = parseInt(color.slice(1, 3), 16)
    const g = parseInt(color.slice(3, 5), 16)
    const b = parseInt(color.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${opacity / 100})`
  }
  
  // Se já for rgba ou outra forma, tentar adicionar opacity
  if (color.startsWith('rgba')) {
    return color.replace(/[\d.]+\)$/g, `${opacity / 100})`)
  }
  
  return color
}

export function getTypographyStyles(config: TypographyConfig): React.CSSProperties {
  const fontSize = typeof config.fontSize === 'object'
    ? config.fontSize.desktop ?? config.fontSize.tablet ?? config.fontSize.mobile ?? 16
    : config.fontSize ?? 16

  return {
    fontSize: typeof fontSize === 'number' ? `${fontSize}px` : fontSize,
    fontWeight: config.fontWeight,
    fontFamily: config.fontFamily,
    lineHeight: typeof config.lineHeight === 'number' 
      ? config.lineHeight 
      : config.lineHeight,
    letterSpacing: typeof config.letterSpacing === 'number'
      ? `${config.letterSpacing}px`
      : config.letterSpacing,
    textAlign: config.textAlign,
    textTransform: config.textTransform
  }
}

export function getSpacingStyles(config: SpacingConfig): React.CSSProperties {
  const styles: React.CSSProperties = {}
  
  if (config.padding) {
    if (typeof config.padding === 'number') {
      styles.padding = `${config.padding}px`
    } else {
      styles.paddingTop = `${config.padding.top ?? 0}px`
      styles.paddingRight = `${config.padding.right ?? 0}px`
      styles.paddingBottom = `${config.padding.bottom ?? 0}px`
      styles.paddingLeft = `${config.padding.left ?? 0}px`
    }
  }
  
  if (config.margin) {
    if (typeof config.margin === 'number') {
      styles.margin = `${config.margin}px`
    } else {
      styles.marginTop = `${config.margin.top ?? 0}px`
      styles.marginRight = `${config.margin.right ?? 0}px`
      styles.marginBottom = `${config.margin.bottom ?? 0}px`
      styles.marginLeft = `${config.margin.left ?? 0}px`
    }
  }
  
  return styles
}

export function getBorderStyles(config: BorderConfig): React.CSSProperties {
  const styles: React.CSSProperties = {}
  
  if (config.width) {
    styles.borderWidth = `${config.width}px`
  }
  
  if (config.color) {
    styles.borderColor = getColorWithOpacity(config.color)
  }
  
  if (config.style) {
    styles.borderStyle = config.style
  }
  
  if (config.radius !== undefined) {
    styles.borderRadius = `${config.radius}px`
  }
  
  return styles
}

export function getImageStyles(config: ImageConfig): React.CSSProperties {
  const styles: React.CSSProperties = {}
  
  if (config.objectFit) {
    styles.objectFit = config.objectFit
  }
  
  if (config.position) {
    styles.objectPosition = config.position
  }
  
  if (config.aspectRatio) {
    styles.aspectRatio = config.aspectRatio
  }
  
  if (config.borderRadius !== undefined) {
    styles.borderRadius = `${config.borderRadius}px`
  }
  
  if (config.filters) {
    const filters: string[] = []
    
    if (config.filters.brightness !== undefined) {
      filters.push(`brightness(${config.filters.brightness}%)`)
    }
    if (config.filters.contrast !== undefined) {
      filters.push(`contrast(${config.filters.contrast}%)`)
    }
    if (config.filters.grayscale !== undefined) {
      filters.push(`grayscale(${config.filters.grayscale}%)`)
    }
    if (config.filters.blur !== undefined) {
      filters.push(`blur(${config.filters.blur}px)`)
    }
    
    if (filters.length > 0) {
      styles.filter = filters.join(' ')
    }
  }
  
  return styles
}




