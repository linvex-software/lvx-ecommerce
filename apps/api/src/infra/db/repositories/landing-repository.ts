import { eq, and, desc, asc, inArray } from 'drizzle-orm'
import { db, schema } from '@white-label/db'
import type {
  LandingPage,
  LandingPageWithProducts,
  CreateDynamicPageInput,
  UpdateDynamicPageInput,
  SetPageProductsInput
} from '../../../domain/landing/landing-types'

export class LandingRepository {
  /**
   * Criar nova página dinâmica
   */
  async createDynamicPage(
    storeId: string,
    input: CreateDynamicPageInput
  ): Promise<LandingPage> {
    const [page] = await db
      .insert(schema.landingPages)
      .values({
        store_id: storeId,
        title: input.title,
        slug: input.slug,
        published: input.published ?? false,
        content_json: input.contentJson || null,
      })
      .returning()

    return this.mapToDomain(page)
  }

  /**
   * Buscar página por ID
   */
  async findById(id: string, storeId: string): Promise<LandingPage | null> {
    const [page] = await db
      .select()
      .from(schema.landingPages)
      .where(and(
        eq(schema.landingPages.id, id),
        eq(schema.landingPages.store_id, storeId)
      ))
      .limit(1)

    return page ? this.mapToDomain(page) : null
  }

  /**
   * Buscar página por slug
   */
  async findBySlug(slug: string, storeId: string): Promise<LandingPage | null> {
    const [page] = await db
      .select()
      .from(schema.landingPages)
      .where(and(
        eq(schema.landingPages.slug, slug),
        eq(schema.landingPages.store_id, storeId)
      ))
      .limit(1)

    return page ? this.mapToDomain(page) : null
  }

  /**
   * Buscar página com produtos associados
   */
  async findByIdWithProducts(
    id: string,
    storeId: string
  ): Promise<LandingPageWithProducts | null> {
    const page = await this.findById(id, storeId)
    if (!page) return null

    const pageProducts = await db
      .select({
        id: schema.dynamicPageProducts.id,
        productId: schema.dynamicPageProducts.product_id,
        orderIndex: schema.dynamicPageProducts.order_index,
        product: {
          id: schema.products.id,
          name: schema.products.name,
          slug: schema.products.slug,
          basePrice: schema.products.base_price,
          sku: schema.products.sku,
          status: schema.products.status,
          mainImage: schema.productImages.image_url,
        }
      })
      .from(schema.dynamicPageProducts)
      .innerJoin(
        schema.products,
        eq(schema.dynamicPageProducts.product_id, schema.products.id)
      )
      .leftJoin(
        schema.productImages,
        and(
          eq(schema.productImages.product_id, schema.products.id),
          eq(schema.productImages.is_main, true)
        )
      )
      .where(eq(schema.dynamicPageProducts.dynamic_page_id, id))
      .orderBy(asc(schema.dynamicPageProducts.order_index))

    return {
      ...page,
      products: pageProducts.map(p => ({
        id: p.id,
        productId: p.productId,
        orderIndex: p.orderIndex,
        product: {
          ...p.product,
          mainImage: p.product.mainImage || null
        }
      }))
    }
  }

  /**
   * Buscar página por slug com produtos (público)
   */
  async findBySlugWithProducts(
    slug: string,
    storeId: string
  ): Promise<LandingPageWithProducts | null> {
    const page = await this.findBySlug(slug, storeId)
    if (!page) return null

    return this.findByIdWithProducts(page.id, storeId)
  }

  /**
   * Listar todas as páginas dinâmicas de uma loja
   */
  async listByStore(storeId: string): Promise<LandingPage[]> {
    const pages = await db
      .select()
      .from(schema.landingPages)
      .where(eq(schema.landingPages.store_id, storeId))
      .orderBy(desc(schema.landingPages.created_at))

    return pages.map(this.mapToDomain)
  }

  /**
   * Atualizar página dinâmica
   */
  async updateDynamicPage(
    id: string,
    storeId: string,
    input: UpdateDynamicPageInput
  ): Promise<LandingPage | null> {
    const updateData: Record<string, unknown> = {}

    if (input.title !== undefined) updateData.title = input.title
    if (input.slug !== undefined) updateData.slug = input.slug
    if (input.published !== undefined) updateData.published = input.published
    if (input.contentJson !== undefined) updateData.content_json = input.contentJson
    updateData.updated_at = new Date()

    const [page] = await db
      .update(schema.landingPages)
      .set(updateData)
      .where(and(
        eq(schema.landingPages.id, id),
        eq(schema.landingPages.store_id, storeId)
      ))
      .returning()

    return page ? this.mapToDomain(page) : null
  }

  /**
   * Atualizar conteúdo Craft.js da página
   */
  async updateDynamicPageContent(
    id: string,
    storeId: string,
    contentJson: Record<string, unknown>
  ): Promise<LandingPage | null> {
    return this.updateDynamicPage(id, storeId, { contentJson })
  }

  /**
   * Definir produtos associados à página
   */
  async setPageProducts(
    pageId: string,
    storeId: string,
    input: SetPageProductsInput
  ): Promise<void> {
    // Verificar se a página pertence à loja
    const page = await this.findById(pageId, storeId)
    if (!page) {
      throw new Error('Page not found')
    }

    // Remover produtos existentes
    await db
      .delete(schema.dynamicPageProducts)
      .where(eq(schema.dynamicPageProducts.dynamic_page_id, pageId))

    // Inserir novos produtos
    if (input.productIds.length > 0) {
      await db
        .insert(schema.dynamicPageProducts)
        .values(
          input.productIds.map((productId, index) => ({
            dynamic_page_id: pageId,
            product_id: productId,
            order_index: index,
          }))
        )
    }
  }

  /**
   * Deletar página dinâmica
   */
  async delete(id: string, storeId: string): Promise<boolean> {
    const result = await db
      .delete(schema.landingPages)
      .where(and(
        eq(schema.landingPages.id, id),
        eq(schema.landingPages.store_id, storeId)
      ))
      .returning()

    return result.length > 0
  }

  /**
   * Mapear linha do banco para formato de domínio
   */
  private mapToDomain(row: typeof schema.landingPages.$inferSelect): LandingPage {
    return {
      id: row.id,
      storeId: row.store_id,
      title: row.title,
      slug: row.slug,
      published: row.published,
      contentJson: row.content_json as Record<string, unknown> | null || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  }
}

