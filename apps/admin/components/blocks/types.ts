export interface ElementStyles {
  color?: string
  backgroundColor?: string
  fontSize?: string
  fontWeight?: string
  fontFamily?: string
  lineHeight?: string
  letterSpacing?: string
  padding?: string
  margin?: string
  marginTop?: string
  marginBottom?: string
  marginLeft?: string
  marginRight?: string
  paddingTop?: string
  paddingBottom?: string
  paddingLeft?: string
  paddingRight?: string
  textAlign?: 'left' | 'center' | 'right' | 'justify'
  borderRadius?: string
  border?: string
  borderWidth?: string
  borderStyle?: string
  borderColor?: string
  width?: string
  height?: string
  display?: string
  flexDirection?: string
  justifyContent?: string
  alignItems?: string
  gap?: string
}

export interface Block {
  id?: string
  type: string
  enabled?: boolean
  order?: number
  props: Record<string, unknown>
  styles?: ElementStyles
  children?: Block[]
}

