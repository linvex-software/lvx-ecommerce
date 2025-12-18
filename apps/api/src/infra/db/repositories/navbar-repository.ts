import { eq, and, isNull, asc } from 'drizzle-orm'
import { db, schema } from '@white-label/db'
import type {
  NavbarItem,
  CreateNavbarItemInput,
  UpdateNavbarItemInput
} from '../../../domain/navbar/navbar-types'

export class NavbarRepository {
  /**
   * Buscar todos os itens da navbar de uma loja
   * Retorna em formato hierárquico (com children)
   */
  async findByStoreId(storeId: string): Promise<NavbarItem[]> {
    const items = await db
      .select()
      .from(schema.navbarItems)
      .where(eq(schema.navbarItems.storeId, storeId))
      .orderBy(asc(schema.navbarItems.order))

    // Mapear para formato de domínio
    const mappedItems = items.map((item) => this.mapToDomain(item))

    // Transformar para formato hierárquico
    return this.buildHierarchy(mappedItems)
  }

  /**
   * Buscar item por ID
   */
  async findById(id: string, storeId: string): Promise<NavbarItem | null> {
    const [item] = await db
      .select()
      .from(schema.navbarItems)
      .where(
        and(
          eq(schema.navbarItems.id, id),
          eq(schema.navbarItems.storeId, storeId)
        )
      )
      .limit(1)

    return item ? this.mapToDomain(item) : null
  }

  /**
   * Criar novo item
   */
  async create(
    storeId: string,
    input: CreateNavbarItemInput
  ): Promise<NavbarItem> {
    const [item] = await db
      .insert(schema.navbarItems)
      .values({
        storeId: storeId,
        label: input.label,
        type: input.type,
        url: input.url || null,
        target: input.target || '_self',
        icon: input.icon || null,
        visible: input.visible ?? true,
        order: input.order ?? 0,
        parentId: input.parentId || null,
        style: input.style || null,
      })
      .returning()

    return this.mapToDomain(item)
  }

  /**
   * Atualizar item
   */
  async update(
    id: string,
    storeId: string,
    input: UpdateNavbarItemInput
  ): Promise<NavbarItem> {
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    }

    if (input.label !== undefined) updateData.label = input.label
    if (input.type !== undefined) updateData.type = input.type
    if (input.url !== undefined) updateData.url = input.url || null
    if (input.target !== undefined) updateData.target = input.target
    if (input.icon !== undefined) updateData.icon = input.icon || null
    if (input.visible !== undefined) updateData.visible = input.visible
    if (input.order !== undefined) updateData.order = input.order
    if (input.parentId !== undefined) updateData.parentId = input.parentId || null
    if (input.style !== undefined) updateData.style = input.style || null

    const [item] = await db
      .update(schema.navbarItems)
      .set(updateData)
      .where(
        and(
          eq(schema.navbarItems.id, id),
          eq(schema.navbarItems.storeId, storeId)
        )
      )
      .returning()

    return this.mapToDomain(item)
  }

  /**
   * Deletar item
   */
  async delete(id: string, storeId: string): Promise<void> {
    await db
      .delete(schema.navbarItems)
      .where(
        and(
          eq(schema.navbarItems.id, id),
          eq(schema.navbarItems.storeId, storeId)
        )
      )
  }

  /**
   * Atualizar ordem de múltiplos itens
   */
  async updateOrder(
    storeId: string,
    updates: Array<{ id: string; order: number }>
  ): Promise<void> {
    // Atualizar em transação
    for (const update of updates) {
      await db
        .update(schema.navbarItems)
        .set({
          order: update.order,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(schema.navbarItems.id, update.id),
            eq(schema.navbarItems.storeId, storeId)
          )
        )
    }
  }

  /**
   * Construir hierarquia de itens (pai-filho)
   */
  private buildHierarchy(items: NavbarItem[]): NavbarItem[] {
    const itemMap = new Map<string, NavbarItem>()
    const rootItems: NavbarItem[] = []

    // Criar mapa de itens
    items.forEach((item) => {
      itemMap.set(item.id, { ...item, children: [] })
    })

    // Construir hierarquia
    items.forEach((item) => {
      const itemWithChildren = itemMap.get(item.id)!
      if (item.parentId && itemMap.has(item.parentId)) {
        const parent = itemMap.get(item.parentId)!
        if (!parent.children) {
          parent.children = []
        }
        parent.children.push(itemWithChildren)
      } else {
        rootItems.push(itemWithChildren)
      }
    })

    // Ordenar por order
    const sortByOrder = (items: NavbarItem[]): NavbarItem[] => {
      return items
        .sort((a, b) => a.order - b.order)
        .map((item) => ({
          ...item,
          children: item.children ? sortByOrder(item.children) : undefined,
        }))
    }

    return sortByOrder(rootItems)
  }

  /**
   * Mapear linha do banco para formato de domínio
   */
  private mapToDomain(row: typeof schema.navbarItems.$inferSelect): NavbarItem {
    return {
      id: row.id,
      storeId: row.storeId,
      label: row.label,
      type: row.type as NavbarItem['type'],
      url: row.url || undefined,
      target: (row.target as NavbarItem['target']) || '_self',
      icon: row.icon || undefined,
      visible: row.visible,
      order: row.order,
      parentId: row.parentId || undefined,
      style: row.style as NavbarItem['style'] || undefined,
      children: undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }
  }
}

