/**
 * Tipos de domínio para Navbar
 */

export type NavbarItemType = 'internal' | 'external' | 'submenu'
export type NavbarItemTarget = '_self' | '_blank'

export interface NavbarItemStyle {
  color?: string
  hoverColor?: string
  fontSize?: string
  fontWeight?: string
  padding?: string
  margin?: string
  border?: string
  borderRadius?: string
  responsive?: {
    desktop?: Record<string, unknown>
    mobile?: Record<string, unknown>
  }
}

export interface NavbarItem {
  id: string
  storeId: string
  label: string
  type: NavbarItemType
  url?: string
  target: NavbarItemTarget
  icon?: string
  visible: boolean
  order: number
  parentId?: string | null
  style?: NavbarItemStyle | null
  children?: NavbarItem[]
  createdAt: Date
  updatedAt: Date
}

export interface CreateNavbarItemInput {
  label: string
  type: NavbarItemType
  url?: string
  target?: NavbarItemTarget
  icon?: string
  visible?: boolean
  order?: number
  parentId?: string | null
  style?: NavbarItemStyle | null
}

export interface UpdateNavbarItemInput {
  label?: string
  type?: NavbarItemType
  url?: string
  target?: NavbarItemTarget
  icon?: string
  visible?: boolean
  order?: number
  parentId?: string | null
  style?: NavbarItemStyle | null
}











