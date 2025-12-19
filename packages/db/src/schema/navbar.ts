import { pgTable, uuid, text, boolean, integer, jsonb, timestamp } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { stores } from './core'

/**
 * Tabela de itens da navbar
 * Cada loja pode ter múltiplos itens de menu configuráveis
 */
export const navbarItems = pgTable('navbar_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  storeId: uuid('store_id')
    .notNull()
    .references(() => stores.id, { onDelete: 'cascade' }),
  
  // Identificação e tipo
  label: text('label').notNull(),
  type: text('type').notNull().$type<
    'link' | 'internal' | 'external' | 'submenu' | 
    'category' | 'collection' | 'page' | 'dynamic-list' | 'custom-block'
  >(),
  url: text('url'), // Obrigatório se type for internal, external ou link
  target: text('target').$type<'_self' | '_blank'>().default('_self'),
  icon: text('icon'), // Nome do ícone (lucide-react)
  
  // Visibilidade e ordem
  visible: boolean('visible').notNull().default(true),
  order: integer('order').notNull().default(0),
  
  // Relacionamento pai-filho (para submenus)
  parentId: uuid('parent_id'),
  
  // Configurações específicas por tipo (JSONB)
  config: jsonb('config').$type<{
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
  }>(),
  
  // Controle de visibilidade por breakpoint (JSONB)
  visibility: jsonb('visibility').$type<{
    desktop?: boolean
    tablet?: boolean
    mobile?: boolean
  }>(),
  
  // Estilos (JSON)
  style: jsonb('style').$type<{
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
  }>(),
  
  // Metadados
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

/**
 * Relações
 */
export const navbarItemsRelations = relations(navbarItems, ({ one, many }) => ({
  store: one(stores, {
    fields: [navbarItems.storeId],
    references: [stores.id],
  }),
  parent: one(navbarItems, {
    fields: [navbarItems.parentId],
    references: [navbarItems.id],
    relationName: 'parent',
  }),
  children: many(navbarItems, {
    relationName: 'parent',
  }),
}))

