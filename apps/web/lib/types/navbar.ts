/**
 * Tipos para Navbar (compatível com API)
 */

export type NavbarItemType = 
  | 'link' 
  | 'internal' 
  | 'external' 
  | 'submenu' 
  | 'category' 
  | 'collection' 
  | 'page' 
  | 'dynamic-list' 
  | 'custom-block'

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

export interface NavbarItemConfig {
  // Para category
  showAll?: boolean
  selectedCategories?: string[]
  sortBy?: 'alphabetical' | 'manual' | 'featured'
  maxDepth?: number
  displayType?: 'list' | 'columns' | 'mega-menu'
  showImages?: boolean
  onlyActive?: boolean
  onlyWithProducts?: boolean
  showInMenu?: boolean
  
  // Para collection
  collectionId?: string
  collectionType?: 'tag' | 'custom'
  
  // Para dynamic-list
  listType?: 'featured' | 'on-sale' | 'best-sellers' | 'new-arrivals'
  limit?: number
  
  // Para page
  pageId?: string
  
  // Para custom-block
  blockType?: 'banner' | 'image' | 'product-card' | 'cta'
  blockData?: Record<string, unknown>
}

export interface NavbarItemVisibility {
  desktop?: boolean
  tablet?: boolean
  mobile?: boolean
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
  config?: NavbarItemConfig | null
  visibility?: NavbarItemVisibility | null
  style?: NavbarItemStyle | null
  children?: NavbarItem[]
  createdAt: string
  updatedAt: string
}












