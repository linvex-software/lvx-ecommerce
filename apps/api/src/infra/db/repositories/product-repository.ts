import { db, schema } from '@white-label/db'
import { eq, and, or, like, desc, sql, count, inArray } from 'drizzle-orm'
import type {
  Product,
  ProductWithRelations,
  CreateProductInput,
  UpdateProductInput,
  ProductListFilters,
  ProductListResult
} from '../../../domain/catalog/product-types'

export class ProductRepository {
  async listByStore(
    storeId: string,
    filters?: ProductListFilters
  ): Promise<ProductListResult> {
    const page = filters?.page ?? 1
    const limit = filters?.limit ?? 20
    const offset = (page - 1) * limit

    const conditions = [eq(schema.products.store_id, storeId)]

    if (filters?.q) {
      conditions.push(
        or(
          like(schema.products.name, `%${filters.q}%`),
          like(schema.products.sku, `%${filters.q}%`)
        )!
      )
    }

    if (filters?.status) {
      conditions.push(eq(schema.products.status, filters.status))
    }

    if (filters?.category_id) {
      const productsInCategory = await db
        .select({ product_id: schema.productCategory.product_id })
        .from(schema.productCategory)
        .where(eq(schema.productCategory.category_id, filters.category_id))

      if (productsInCategory.length > 0) {
        const productIds = productsInCategory.map((p) => p.product_id)
        conditions.push(inArray(schema.products.id, productIds))
      } else {
        // Se não há produtos na categoria, retornar vazio
        conditions.push(sql`1 = 0`)
      }
    }

    const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0]

    const [totalResult] = await db
      .select({ count: count() })
      .from(schema.products)
      .where(whereClause!)

    const total = totalResult?.count ?? 0
    const totalPages = Math.ceil(total / limit)

    const products = await db
      .select()
      .from(schema.products)
      .where(whereClause!)
      .orderBy(desc(schema.products.created_at))
      .limit(limit)
      .offset(offset)

    return {
      products: products.map((row) => this.mapRowToProduct(row)),
      total,
      page,
      limit,
      totalPages
    }
  }

  async findById(id: string, storeId: string): Promise<Product | null> {
    const result = await db
      .select()
      .from(schema.products)
      .where(and(eq(schema.products.id, id), eq(schema.products.store_id, storeId)))
      .limit(1)

    if (result.length === 0) {
      return null
    }

    return this.mapRowToProduct(result[0])
  }

  async findBySlug(slug: string, storeId: string): Promise<Product | null> {
    const result = await db
      .select()
      .from(schema.products)
      .where(
        and(
          eq(schema.products.slug, slug),
          eq(schema.products.store_id, storeId),
          eq(schema.products.status, 'active')
        )
      )
      .limit(1)

    if (result.length === 0) {
      return null
    }

    return this.mapRowToProduct(result[0])
  }

  async findByIdWithRelations(
    id: string,
    storeId: string
  ): Promise<ProductWithRelations | null> {
    const product = await this.findById(id, storeId)
    if (!product) {
      return null
    }

    const [variants, images, categoriesData, seoData, sizeChartData] =
      await Promise.all([
        db
          .select()
          .from(schema.productVariants)
          .where(
            and(
              eq(schema.productVariants.product_id, id),
              eq(schema.productVariants.store_id, storeId)
            )
          )
          .orderBy(schema.productVariants.id),

        db
          .select()
          .from(schema.productImages)
          .where(
            and(
              eq(schema.productImages.product_id, id),
              eq(schema.productImages.store_id, storeId)
            )
          )
          .orderBy(schema.productImages.position),

        (async () => {
          const productCategories = await db
            .select({
              category_id: schema.productCategory.category_id
            })
            .from(schema.productCategory)
            .where(eq(schema.productCategory.product_id, id))

          if (productCategories.length === 0) {
            return []
          }
          const categoryIds = productCategories.map((pc) => pc.category_id)
          if (categoryIds.length === 0) {
            return []
          }
          return db
            .select()
            .from(schema.categories)
            .where(
              and(
                eq(schema.categories.store_id, storeId),
                inArray(schema.categories.id, categoryIds)
              )
            )
        })(),

        db
          .select()
          .from(schema.productSeo)
          .where(
            and(
              eq(schema.productSeo.product_id, id),
              eq(schema.productSeo.store_id, storeId)
            )
          )
          .limit(1),

        db
          .select()
          .from(schema.productSizeChart)
          .where(
            and(
              eq(schema.productSizeChart.product_id, id),
              eq(schema.productSizeChart.store_id, storeId)
            )
          )
          .limit(1)
      ])

    return {
      ...product,
      variants: variants.map((row) => ({
        id: row.id,
        store_id: row.store_id,
        product_id: row.product_id,
        sku: row.sku,
        size: row.size,
        color: row.color,
        barcode: row.barcode,
        price_override: row.price_override,
        active: row.active
      })),
      images: images.map((row) => ({
        id: row.id,
        store_id: row.store_id,
        product_id: row.product_id,
        image_url: row.image_url,
        position: row.position,
        is_main: row.is_main
      })),
      categories: categoriesData.map((cat) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug
      })),
      seo: seoData.length > 0
        ? {
            id: seoData[0].id,
            store_id: seoData[0].store_id,
            product_id: seoData[0].product_id,
            meta_title: seoData[0].meta_title,
            meta_description: seoData[0].meta_description,
            meta_keywords: seoData[0].meta_keywords,
            open_graph_image: seoData[0].open_graph_image,
            created_at: seoData[0].created_at,
            updated_at: seoData[0].updated_at
          }
        : null,
      size_chart: sizeChartData.length > 0
        ? {
            id: sizeChartData[0].id,
            store_id: sizeChartData[0].store_id,
            product_id: sizeChartData[0].product_id,
            name: sizeChartData[0].name,
            chart_json: sizeChartData[0].chart_json as Record<string, unknown>,
            created_at: sizeChartData[0].created_at,
            updated_at: sizeChartData[0].updated_at
          }
        : null
    }
  }

  async findBySlugWithRelations(
    slug: string,
    storeId: string
  ): Promise<ProductWithRelations | null> {
    const product = await this.findBySlug(slug, storeId)
    if (!product) {
      return null
    }

    return this.findByIdWithRelations(product.id, storeId)
  }

  async create(data: CreateProductInput): Promise<Product> {
    const result = await db
      .insert(schema.products)
      .values({
        store_id: data.store_id,
        name: data.name,
        slug: data.slug,
        description: data.description ?? null,
        base_price: data.base_price.toString(),
        sku: data.sku,
        status: data.status ?? 'draft',
        virtual_model_url: data.virtual_model_url ?? null,
        virtual_provider: data.virtual_provider ?? null,
        virtual_config_json: data.virtual_config_json ?? null
      })
      .returning()

    const product = this.mapRowToProduct(result[0])

    // Criar variantes
    if (data.variants && data.variants.length > 0) {
      await db.insert(schema.productVariants).values(
        data.variants.map((v) => ({
          store_id: data.store_id,
          product_id: product.id,
          sku: v.sku ?? null,
          size: v.size ?? null,
          color: v.color ?? null,
          barcode: v.barcode ?? null,
          price_override: v.price_override ? v.price_override.toString() : null,
          active: v.active ?? true
        }))
      )
    }

    // Criar imagens
    if (data.images && data.images.length > 0) {
      await db.insert(schema.productImages).values(
        data.images.map((img, index) => ({
          store_id: data.store_id,
          product_id: product.id,
          image_url: img.image_url,
          position: img.position ?? index,
          is_main: img.is_main ?? index === 0
        }))
      )
    }

    // Criar categorias
    if (data.category_ids && data.category_ids.length > 0) {
      await db.insert(schema.productCategory).values(
        data.category_ids.map((categoryId) => ({
          product_id: product.id,
          category_id: categoryId
        }))
      )
    }

    // Criar SEO
    if (data.seo) {
      await db.insert(schema.productSeo).values({
        store_id: data.store_id,
        product_id: product.id,
        meta_title: data.seo.meta_title ?? null,
        meta_description: data.seo.meta_description ?? null,
        meta_keywords: data.seo.meta_keywords ?? null,
        open_graph_image: data.seo.open_graph_image ?? null
      })
    }

    // Criar size chart
    if (data.size_chart) {
      await db.insert(schema.productSizeChart).values({
        store_id: data.store_id,
        product_id: product.id,
        name: data.size_chart.name,
        chart_json: data.size_chart.chart_json
      })
    }

    return product
  }

  async update(
    id: string,
    storeId: string,
    data: UpdateProductInput
  ): Promise<Product> {
    const updateData: {
      name?: string
      slug?: string
      description?: string | null
      base_price?: string
      sku?: string
      status?: string
      virtual_model_url?: string | null
      virtual_provider?: string | null
      virtual_config_json?: Record<string, unknown> | null
      updated_at?: Date
    } = {
      updated_at: new Date()
    }

    if (data.name !== undefined) updateData.name = data.name
    if (data.slug !== undefined) updateData.slug = data.slug
    if (data.description !== undefined) updateData.description = data.description
    if (data.base_price !== undefined) updateData.base_price = data.base_price.toString()
    if (data.sku !== undefined) updateData.sku = data.sku
    if (data.status !== undefined) updateData.status = data.status
    if (data.virtual_model_url !== undefined)
      updateData.virtual_model_url = data.virtual_model_url
    if (data.virtual_provider !== undefined)
      updateData.virtual_provider = data.virtual_provider
    if (data.virtual_config_json !== undefined)
      updateData.virtual_config_json = data.virtual_config_json

    const result = await db
      .update(schema.products)
      .set(updateData)
      .where(and(eq(schema.products.id, id), eq(schema.products.store_id, storeId)))
      .returning()

    if (result.length === 0) {
      throw new Error('Product not found')
    }

    const product = this.mapRowToProduct(result[0])

    // Atualizar variantes
    if (data.variants !== undefined) {
      // Deletar todas as variantes existentes
      await db
        .delete(schema.productVariants)
        .where(
          and(
            eq(schema.productVariants.product_id, id),
            eq(schema.productVariants.store_id, storeId)
          )
        )

      // Criar novas variantes
      if (data.variants.length > 0) {
        await db.insert(schema.productVariants).values(
          data.variants.map((v) => ({
            store_id: storeId,
            product_id: id,
            sku: v.sku ?? null,
            size: v.size ?? null,
            color: v.color ?? null,
            barcode: v.barcode ?? null,
            price_override: v.price_override ? v.price_override.toString() : null,
            active: v.active ?? true
          }))
        )
      }
    }

    // Atualizar imagens
    if (data.images !== undefined) {
      // Deletar todas as imagens existentes
      await db
        .delete(schema.productImages)
        .where(
          and(
            eq(schema.productImages.product_id, id),
            eq(schema.productImages.store_id, storeId)
          )
        )

      // Criar novas imagens
      if (data.images.length > 0) {
        await db.insert(schema.productImages).values(
          data.images.map((img, index) => ({
            store_id: storeId,
            product_id: id,
            image_url: img.image_url,
            position: img.position ?? index,
            is_main: img.is_main ?? index === 0
          }))
        )
      }
    }

    // Atualizar categorias
    if (data.category_ids !== undefined) {
      // Deletar todas as categorias existentes
      await db
        .delete(schema.productCategory)
        .where(eq(schema.productCategory.product_id, id))

      // Criar novas categorias
      if (data.category_ids.length > 0) {
        await db.insert(schema.productCategory).values(
          data.category_ids.map((categoryId) => ({
            product_id: id,
            category_id: categoryId
          }))
        )
      }
    }

    // Atualizar SEO
    if (data.seo !== undefined) {
      const existingSeo = await db
        .select()
        .from(schema.productSeo)
        .where(
          and(
            eq(schema.productSeo.product_id, id),
            eq(schema.productSeo.store_id, storeId)
          )
        )
        .limit(1)

      if (existingSeo.length > 0) {
        await db
          .update(schema.productSeo)
          .set({
            meta_title: data.seo.meta_title ?? null,
            meta_description: data.seo.meta_description ?? null,
            meta_keywords: data.seo.meta_keywords ?? null,
            open_graph_image: data.seo.open_graph_image ?? null,
            updated_at: new Date()
          })
          .where(eq(schema.productSeo.id, existingSeo[0].id))
      } else {
        await db.insert(schema.productSeo).values({
          store_id: storeId,
          product_id: id,
          meta_title: data.seo.meta_title ?? null,
          meta_description: data.seo.meta_description ?? null,
          meta_keywords: data.seo.meta_keywords ?? null,
          open_graph_image: data.seo.open_graph_image ?? null
        })
      }
    }

    // Atualizar size chart
    if (data.size_chart !== undefined) {
      const existingSizeChart = await db
        .select()
        .from(schema.productSizeChart)
        .where(
          and(
            eq(schema.productSizeChart.product_id, id),
            eq(schema.productSizeChart.store_id, storeId)
          )
        )
        .limit(1)

      if (existingSizeChart.length > 0) {
        await db
          .update(schema.productSizeChart)
          .set({
            name: data.size_chart.name,
            chart_json: data.size_chart.chart_json,
            updated_at: new Date()
          })
          .where(eq(schema.productSizeChart.id, existingSizeChart[0].id))
      } else {
        await db.insert(schema.productSizeChart).values({
          store_id: storeId,
          product_id: id,
          name: data.size_chart.name,
          chart_json: data.size_chart.chart_json
        })
      }
    }

    return product
  }

  async softDelete(id: string, storeId: string): Promise<void> {
    const result = await db
      .update(schema.products)
      .set({ status: 'inactive', updated_at: new Date() })
      .where(and(eq(schema.products.id, id), eq(schema.products.store_id, storeId)))
      .returning()

    if (result.length === 0) {
      throw new Error('Product not found')
    }
  }

  private mapRowToProduct(row: {
    id: string
    store_id: string
    name: string
    slug: string
    description: string | null
    base_price: string
    sku: string
    status: string
    virtual_model_url: string | null
    virtual_provider: string | null
    virtual_config_json: Record<string, unknown> | null
    created_at: Date
    updated_at: Date
  }): Product {
    return {
      id: row.id,
      store_id: row.store_id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      base_price: row.base_price,
      sku: row.sku,
      status: row.status as 'draft' | 'active' | 'inactive',
      virtual_model_url: row.virtual_model_url,
      virtual_provider: row.virtual_provider,
      virtual_config_json: row.virtual_config_json,
      created_at: row.created_at,
      updated_at: row.updated_at
    }
  }
}

