import type { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { NavbarRepository } from '../../../infra/db/repositories/navbar-repository'
import { CategoryRepository } from '../../../infra/db/repositories/category-repository'
import { db, schema } from '@white-label/db'
import { eq } from 'drizzle-orm'
import type {
  CreateNavbarItemInput,
  UpdateNavbarItemInput,
  NavbarItem
} from '../../../domain/navbar/navbar-types'

const navbarItemConfigSchema = z.object({
  // Para category
  showAll: z.boolean().optional(),
  selectedCategories: z.array(z.string().uuid()).optional(),
  sortBy: z.enum(['alphabetical', 'manual', 'featured']).optional(),
  maxDepth: z.number().int().min(1).max(5).optional(),
  displayType: z.enum(['list', 'columns', 'mega-menu']).optional(),
  showImages: z.boolean().optional(),
  onlyActive: z.boolean().optional(),
  onlyWithProducts: z.boolean().optional(),
  showInMenu: z.boolean().optional(),
  
  // Para collection
  collectionId: z.string().uuid().optional(),
  collectionType: z.enum(['tag', 'custom']).optional(),
  
  // Para dynamic-list
  listType: z.enum(['featured', 'on-sale', 'best-sellers', 'new-arrivals']).optional(),
  limit: z.number().int().min(1).max(50).optional(),
  
  // Para page
  pageId: z.string().uuid().optional(),
  
  // Para custom-block
  blockType: z.enum(['banner', 'image', 'product-card', 'cta']).optional(),
  blockData: z.record(z.unknown()).optional(),
}).optional().nullable()

const navbarItemVisibilitySchema = z.object({
  desktop: z.boolean().optional(),
  tablet: z.boolean().optional(),
  mobile: z.boolean().optional(),
}).optional().nullable()

const createNavbarItemSchema = z.object({
  label: z.string().min(1).max(100),
  type: z.enum(['link', 'internal', 'external', 'submenu', 'category', 'collection', 'page', 'dynamic-list', 'custom-block']),
  url: z.string().optional(),
  target: z.enum(['_self', '_blank']).optional(),
  icon: z.string().optional(),
  visible: z.boolean().optional(),
  order: z.number().int().optional(),
  parentId: z.string().uuid().nullable().optional(),
  config: navbarItemConfigSchema,
  visibility: navbarItemVisibilitySchema,
  style: z
    .object({
      color: z.string().optional(),
      hoverColor: z.string().optional(),
      fontSize: z.string().optional(),
      fontWeight: z.string().optional(),
      padding: z.string().optional(),
      margin: z.string().optional(),
      border: z.string().optional(),
      borderRadius: z.string().optional(),
      responsive: z
        .object({
          desktop: z.record(z.unknown()).optional(),
          mobile: z.record(z.unknown()).optional(),
        })
        .optional(),
    })
    .optional()
    .nullable(),
})

const updateNavbarItemSchema = createNavbarItemSchema.partial()

const updateOrderSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().uuid(),
      order: z.number().int(),
    })
  ),
})

export class NavbarController {
  constructor(
    private readonly navbarRepository: NavbarRepository,
    private readonly categoryRepository?: CategoryRepository
  ) {}

  /**
   * GET /admin/navbar - Listar todos os itens
   * Sempre inclui um item de categorias padrão se não existir
   */
  async list(request: FastifyRequest, reply: FastifyReply) {
    try {
      const storeId = (request as any).storeId as string

      let items = await this.navbarRepository.findByStoreId(storeId)

      // Verificar se existe um item do tipo 'category'
      const hasCategoryItem = items.some(item => item.type === 'category')

      // Se não existir, criar um item padrão de categorias dinamicamente
      if (!hasCategoryItem) {
        const defaultCategoryItem = await this.createDefaultCategoryItem(storeId)
        if (defaultCategoryItem) {
          items = [defaultCategoryItem, ...items]
        }
      } else {
        // Se existe, popular os filhos com as categorias reais
        items = await this.populateCategoryItems(items, storeId)
      }

      return reply.status(200).send({ navbar_items: items })
    } catch (error) {
      console.error('Error listing navbar items:', error)
      return reply.status(500).send({ error: 'Failed to list navbar items' })
    }
  }

  /**
   * Criar item padrão de categorias
   */
  private async createDefaultCategoryItem(storeId: string): Promise<NavbarItem | null> {
    if (!this.categoryRepository) {
      return null
    }

    try {
      // Buscar categorias da loja
      const categories = await this.categoryRepository.listTreeByStore(storeId)

      // Filtrar apenas categorias raiz (sem parent)
      const rootCategories = categories.filter(cat => !cat.parent_id)

      // Criar item de categorias padrão
      const now = new Date()
      const defaultItem: NavbarItem = {
        id: `default-categories-${storeId}`,
        storeId,
        label: 'Categorias',
        type: 'category',
        url: undefined,
        target: '_self',
        icon: undefined,
        visible: true,
        order: 0,
        parentId: null,
        config: {
          showAll: true,
          displayType: 'mega-menu',
          maxDepth: 2,
        },
        visibility: {
          desktop: true,
          mobile: true,
        },
        style: null,
        children: rootCategories.map((cat, index) => this.categoryToNavbarItem(cat, categories, index)),
        createdAt: now,
        updatedAt: now,
      }

      return defaultItem
    } catch (error) {
      console.error('Error creating default category item:', error)
      return null
    }
  }

  /**
   * Popular itens de categorias com dados reais
   */
  private async populateCategoryItems(items: NavbarItem[], storeId: string): Promise<NavbarItem[]> {
    if (!this.categoryRepository) {
      return items
    }

    try {
      // Buscar todas as categorias
      const categories = await this.categoryRepository.listTreeByStore(storeId)

      // Mapear categorias por ID para busca rápida
      const categoryMap = new Map(categories.map(cat => [cat.id, cat]))

      // Função recursiva para popular filhos de um item de categoria
      const populateItem = (item: NavbarItem): NavbarItem => {
        if (item.type === 'category' && item.config) {
          const config = item.config
          
          // Se showAll ou selectedCategories não especificado, mostrar todas as raiz
          if (config.showAll !== false) {
            const rootCategories = categories.filter(cat => !cat.parent_id)
            item.children = rootCategories.map((cat, index) => 
              this.categoryToNavbarItem(cat, categories, index)
            )
          } else if (config.selectedCategories && config.selectedCategories.length > 0) {
            // Mostrar apenas categorias selecionadas
            item.children = config.selectedCategories
              .map(catId => categoryMap.get(catId))
              .filter((cat): cat is NonNullable<typeof cat> => cat !== undefined)
              .map((cat, index) => this.categoryToNavbarItem(cat, categories, index))
          }
        }

        // Recursivamente popular filhos
        if (item.children) {
          item.children = item.children.map(populateItem)
        }

        return item
      }

      return items.map(populateItem)
    } catch (error) {
      console.error('Error populating category items:', error)
      return items
    }
  }

  /**
   * Converter Category para NavbarItem
   */
  private categoryToNavbarItem(
    category: any,
    allCategories: any[],
    order: number
  ): NavbarItem {
    const now = new Date()
    
    // Buscar filhos da categoria
    const children = allCategories.filter(cat => cat.parent_id === category.id)

    return {
      id: `category-${category.id}`,
      storeId: category.store_id,
      label: category.name,
      type: 'link',
      url: `/produtos?category_id=${category.id}`,
      target: '_self',
      icon: undefined,
      visible: true,
      order,
      parentId: null,
      config: null,
      visibility: null,
      style: null,
      children: children.length > 0 
        ? children.map((child, idx) => this.categoryToNavbarItem(child, allCategories, idx))
        : undefined,
      createdAt: category.created_at || now,
      updatedAt: category.created_at || now,
    }
  }

  /**
   * GET /admin/navbar/:id - Buscar item por ID
   */
  async get(request: FastifyRequest, reply: FastifyReply) {
    try {
      const storeId = (request as any).storeId as string
      const { id } = request.params as { id: string }

      const item = await this.navbarRepository.findById(id, storeId)

      if (!item) {
        return reply.status(404).send({ error: 'Navbar item not found' })
      }

      return reply.status(200).send({ navbar_item: item })
    } catch (error) {
      console.error('Error getting navbar item:', error)
      return reply.status(500).send({ error: 'Failed to get navbar item' })
    }
  }

  /**
   * POST /admin/navbar - Criar novo item
   */
  async create(request: FastifyRequest, reply: FastifyReply) {
    try {
      const storeId = (request as any).storeId as string
      const body = createNavbarItemSchema.parse(request.body)

      // Validações adicionais
      const typesRequiringUrl = ['link', 'internal', 'external']
      if (typesRequiringUrl.includes(body.type) && !body.url) {
        return reply
          .status(400)
          .send({ error: `URL is required for ${body.type} items` })
      }

      // Sanitizar label
      const sanitizedLabel = this.sanitizeLabel(body.label)

      const input: CreateNavbarItemInput = {
        ...body,
        label: sanitizedLabel,
      }

      const item = await this.navbarRepository.create(storeId, input)

      return reply.status(201).send({ navbar_item: item })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Validation error', details: error.errors })
      }
      console.error('Error creating navbar item:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return reply.status(500).send({ 
        error: 'Failed to create navbar item',
        details: errorMessage 
      })
    }
  }

  /**
   * PUT /admin/navbar/:id - Atualizar item
   */
  async update(request: FastifyRequest, reply: FastifyReply) {
    try {
      const storeId = (request as any).storeId as string
      const { id } = request.params as { id: string }
      const body = updateNavbarItemSchema.parse(request.body)

      // Verificar se item existe
      const existing = await this.navbarRepository.findById(id, storeId)
      if (!existing) {
        return reply.status(404).send({ error: 'Navbar item not found' })
      }

      // Sanitizar label se fornecido
      const input: UpdateNavbarItemInput = body
      if (body.label) {
        input.label = this.sanitizeLabel(body.label)
      }

      // Validar URL se tipo mudou
      const typesRequiringUrl = ['link', 'internal', 'external']
      if (body.type && typesRequiringUrl.includes(body.type) && !body.url && !existing.url) {
        return reply
          .status(400)
          .send({ error: `URL is required for ${body.type} items` })
      }

      const item = await this.navbarRepository.update(id, storeId, input)

      return reply.status(200).send({ navbar_item: item })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Validation error', details: error.errors })
      }
      console.error('Error updating navbar item:', error)
      return reply.status(500).send({ error: 'Failed to update navbar item' })
    }
  }

  /**
   * DELETE /admin/navbar/:id - Deletar item
   */
  async delete(request: FastifyRequest, reply: FastifyReply) {
    try {
      const storeId = (request as any).storeId as string
      const { id } = request.params as { id: string }

      await this.navbarRepository.delete(id, storeId)

      return reply.status(204).send()
    } catch (error) {
      console.error('Error deleting navbar item:', error)
      return reply.status(500).send({ error: 'Failed to delete navbar item' })
    }
  }

  /**
   * PUT /admin/navbar/order - Atualizar ordem de múltiplos itens
   */
  async updateOrder(request: FastifyRequest, reply: FastifyReply) {
    try {
      const storeId = (request as any).storeId as string
      const body = updateOrderSchema.parse(request.body)

      await this.navbarRepository.updateOrder(storeId, body.items)

      return reply.status(200).send({ success: true })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Validation error', details: error.errors })
      }
      console.error('Error updating navbar order:', error)
      return reply.status(500).send({ error: 'Failed to update navbar order' })
    }
  }

  /**
   * GET /admin/menu/categories - Listar categorias disponíveis
   */
  async getCategories(request: FastifyRequest, reply: FastifyReply) {
    try {
      const storeId = (request as any).storeId as string
      
      if (!this.categoryRepository) {
        return reply.status(500).send({ error: 'Category repository not available' })
      }

      const categories = await this.categoryRepository.listByStore(storeId, {})
      
      return reply.status(200).send({ categories: categories.items || [] })
    } catch (error) {
      console.error('Error fetching categories:', error)
      return reply.status(500).send({ error: 'Failed to fetch categories' })
    }
  }

  /**
   * GET /admin/menu/pages - Listar páginas, categorias e outras opções para o menu
   */
  async getPages(request: FastifyRequest, reply: FastifyReply) {
    try {
      const storeId = (request as any).storeId as string

      // Buscar páginas institucionais (landing pages antigas)
      const landingPagesRows = await db
        .select({
          id: schema.landingPages.id,
          title: schema.landingPages.title,
          slug: schema.landingPages.slug,
          published: schema.landingPages.published,
        })
        .from(schema.landingPages)
        .where(eq(schema.landingPages.store_id, storeId))
        .orderBy(schema.landingPages.title)
      
      const landingPages = landingPagesRows
        .filter(page => page.published) // Apenas publicadas
        .map((page) => ({
          ...page,
          type: 'page' as const,
        }))

      // Buscar páginas dinâmicas
      const dynamicPagesRows = await db
        .select({
          id: schema.landingPages.id,
          title: schema.landingPages.title,
          slug: schema.landingPages.slug,
          published: schema.landingPages.published,
        })
        .from(schema.landingPages)
        .where(eq(schema.landingPages.store_id, storeId))
        .orderBy(schema.landingPages.title)

      const dynamicPages = dynamicPagesRows
        .filter(page => page.published) // Apenas publicadas
        .map((page) => ({
          id: page.id,
          title: page.title,
          slug: page.slug,
          type: 'dynamic-page' as const,
        }))

      // Buscar categorias
      let categories: Array<{ id: string; title: string; slug: string; type: string }> = []
      if (this.categoryRepository) {
        const categoriesResult = await this.categoryRepository.listByStore(storeId, {})
        categories = (categoriesResult.items || []).map((cat) => ({
          id: cat.id,
          title: cat.name,
          slug: cat.slug,
          type: 'category',
        }))
      }

      // Opções pré-definidas (rotas comuns)
      const predefinedOptions = [
        { id: 'home', title: 'Home / Página Inicial', slug: '/', type: 'route' },
        { id: 'products', title: 'Todos os Produtos', slug: '/produtos', type: 'route' },
        { id: 'about', title: 'Sobre Nós', slug: '/sobre', type: 'route' },
        { id: 'contact', title: 'Contato', slug: '/contato', type: 'route' },
        { id: 'faq', title: 'Perguntas Frequentes', slug: '/faq', type: 'route' },
        { id: 'terms', title: 'Termos de Uso', slug: '/termos', type: 'route' },
        { id: 'privacy', title: 'Política de Privacidade', slug: '/privacidade', type: 'route' },
        { id: 'returns', title: 'Trocas e Devoluções', slug: '/trocas', type: 'route' },
      ]

      // Combinar todas as opções
      const allOptions = [
        ...predefinedOptions,
        ...categories.map((cat) => ({
          id: `category-${cat.id}`,
          title: `📁 ${cat.title} (Categoria)`,
          slug: `/categoria/${cat.slug}`,
          type: 'category',
          categoryId: cat.id,
        })),
        ...landingPages.map((page) => ({
          id: `page-${page.id}`,
          title: `📄 ${page.title} (Página)`,
          slug: `/page/${page.slug}`,
          type: 'page',
          pageId: page.id,
        })),
        ...dynamicPages.map((page) => ({
          id: `dynamic-page-${page.id}`,
          title: `✨ ${page.title} (Página Dinâmica)`,
          slug: `/${page.slug}`,
          type: 'dynamic-page',
          pageId: page.id,
        })),
      ]

      return reply.status(200).send({ pages: allOptions })
    } catch (error) {
      console.error('Error fetching pages:', error)
      return reply.status(500).send({ error: 'Failed to fetch pages' })
    }
  }

  /**
   * Sanitizar label (remover HTML e JS)
   */
  private sanitizeLabel(label: string): string {
    // Remover tags HTML
    let sanitized = label.replace(/<[^>]*>/g, '')
    // Remover scripts
    sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remover event handlers
    sanitized = sanitized.replace(/on\w+="[^"]*"/gi, '')
    // Limitar tamanho
    return sanitized.trim().slice(0, 100)
  }
}

