import { db, schema } from '@white-label/db'
import { eq, and, or, ilike, desc, sql, count, inArray } from 'drizzle-orm'
import type {
  Product,
  ProductWithRelations,
  CreateProductInput,
  UpdateProductInput,
  ProductListFilters,
  ProductListResult
} from '../../../domain/catalog/product-types'

type ProductRow = typeof schema.products.$inferSelect
type ProductRowWithImage = ProductRow & { main_image: string | null }

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
          ilike(schema.products.name, `%${filters.q}%`),
          ilike(schema.products.sku, `%${filters.q}%`)
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

    // Filter by sizes (considering both size chart and variants)
    if (filters?.sizes && filters.sizes.length > 0) {
      // Get products with sizes from size chart
      // Fetch all size charts for the store and filter in memory
      // This is necessary because jsonb_object_keys requires a subquery that's complex with Drizzle
      const allSizeCharts = await db
        .select({
          product_id: schema.productSizeChart.product_id,
          chart_json: schema.productSizeChart.chart_json
        })
        .from(schema.productSizeChart)
        .where(eq(schema.productSizeChart.store_id, storeId))

      // Filter in memory to handle cases where chart_json might be stored as string or have issues
      const validSizeCharts = allSizeCharts.filter((chart) => {
        if (!chart.chart_json) return false

        // Check if it's a valid JSON object
        try {
          let chartData: unknown = chart.chart_json

          // If it's a string, try to parse it
          if (typeof chart.chart_json === 'string') {
            chartData = JSON.parse(chart.chart_json)
          }

          // Check if it's an object (not array, not null)
          if (typeof chartData !== 'object' || chartData === null || Array.isArray(chartData)) {
            return false
          }

          return true
        } catch {
          return false
        }
      })

      // Filter size charts that have any of the requested sizes as keys
      // Normalize sizes for comparison (trim and case-insensitive)
      const normalizedRequestedSizes = filters.sizes!.map((s) => s.trim().toUpperCase())

      const productsWithSizesFromChart = validSizeCharts
        .filter((chart) => {
          if (!chart.chart_json) {
            return false
          }

          // Handle case where chart_json might be a string (shouldn't happen with JSONB, but just in case)
          let chartData: Record<string, unknown>
          if (typeof chart.chart_json === 'string') {
            try {
              chartData = JSON.parse(chart.chart_json) as Record<string, unknown>
            } catch {
              return false
            }
          } else if (typeof chart.chart_json === 'object' && !Array.isArray(chart.chart_json)) {
            chartData = chart.chart_json as Record<string, unknown>
          } else {
            return false
          }

          const sizeKeys = Object.keys(chartData).map((k) => k.trim().toUpperCase())
          return normalizedRequestedSizes.some((requestedSize) => sizeKeys.includes(requestedSize))
        })
        .map((chart) => ({ product_id: chart.product_id }))

      // Get products with sizes from variants
      // Also normalize variant sizes for comparison
      const allVariants = await db
        .selectDistinct({
          product_id: schema.productVariants.product_id,
          size: schema.productVariants.size
        })
        .from(schema.productVariants)
        .where(eq(schema.productVariants.store_id, storeId))

      const productsWithSizesFromVariants = allVariants
        .filter((variant) => {
          if (!variant.size) return false
          const normalizedVariantSize = variant.size.trim().toUpperCase()
          return normalizedRequestedSizes.includes(normalizedVariantSize)
        })
        .map((variant) => ({ product_id: variant.product_id }))

      // Combine both sources (union)
      const allProductIds = new Set<string>()
      productsWithSizesFromChart.forEach((p) => allProductIds.add(p.product_id))
      productsWithSizesFromVariants.forEach((p) => allProductIds.add(p.product_id))

      if (allProductIds.size > 0) {
        const productIds = Array.from(allProductIds)
        conditions.push(inArray(schema.products.id, productIds))
      } else {
        // Se não há produtos com esses tamanhos, retornar vazio
        conditions.push(sql`1 = 0`)
      }
    }

    // Filter by colors
    if (filters?.colors && filters.colors.length > 0) {
      const productsWithColors = await db
        .selectDistinct({ product_id: schema.productVariants.product_id })
        .from(schema.productVariants)
        .where(
          and(
            eq(schema.productVariants.store_id, storeId),
            inArray(schema.productVariants.color, filters.colors)
          )!
        )

      if (productsWithColors.length > 0) {
        const productIds = productsWithColors.map((p) => p.product_id)
        conditions.push(inArray(schema.products.id, productIds))
      } else {
        // Se não há produtos com essas cores, retornar vazio
        conditions.push(sql`1 = 0`)
      }
    }

    // Filter by price range
    if (filters?.min_price !== undefined) {
      conditions.push(sql`${schema.products.base_price} >= ${filters.min_price}`)
    }

    if (filters?.max_price !== undefined) {
      conditions.push(sql`${schema.products.base_price} <= ${filters.max_price}`)
    }


    const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0]

    const [totalResult] = await db
      .select({ count: count() })
      .from(schema.products)
      .where(whereClause!)

    const total = totalResult?.count ?? 0
    const totalPages = Math.ceil(total / limit)

    const productSelection = {
      id: schema.products.id,
      store_id: schema.products.store_id,
      name: schema.products.name,
      slug: schema.products.slug,
      description: schema.products.description,
      base_price: schema.products.base_price,
      sku: schema.products.sku,
      status: schema.products.status,
      virtual_model_url: schema.products.virtual_model_url,
      virtual_provider: schema.products.virtual_provider,
      virtual_config_json: schema.products.virtual_config_json,
      created_at: schema.products.created_at,
      updated_at: schema.products.updated_at,
      main_image: schema.productImages.image_url
    }

    const productRows = await db
      .select(productSelection)
      .from(schema.products)
      .leftJoin(
        schema.productImages,
        and(
          eq(schema.productImages.product_id, schema.products.id),
          eq(schema.productImages.is_main, true)
        )
      )
      .where(whereClause!)
      .orderBy(desc(schema.products.created_at))
      .limit(limit)
      .offset(offset)

    const products = productRows as ProductRowWithImage[]

    const productIds = products.map((product) => product.id)
    const categoriesByProduct: Record<string, string> = {}

    if (productIds.length > 0) {
      const categories = await db
        .select({
          product_id: schema.productCategory.product_id,
          category_name: schema.categories.name
        })
        .from(schema.productCategory)
        .leftJoin(
          schema.categories,
          eq(schema.categories.id, schema.productCategory.category_id)
        )
        .where(inArray(schema.productCategory.product_id, productIds))

      for (const category of categories) {
        if (!category.category_name) continue
        if (!categoriesByProduct[category.product_id]) {
          categoriesByProduct[category.product_id] = category.category_name
        } else {
          categoriesByProduct[category.product_id] = `${categoriesByProduct[category.product_id]}, ${category.category_name}`
        }
      }
    }

    return {
      products: products.map((row) =>
        this.mapRowToProduct({
          ...row,
          category_name: categoriesByProduct[row.id] ?? null
        })
      ),
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

  async hasAssociatedOrders(productId: string): Promise<boolean> {
    const result = await db
      .select({ id: schema.orderItems.id })
      .from(schema.orderItems)
      .where(eq(schema.orderItems.product_id, productId))
      .limit(1)

    return result.length > 0
  }

  async hasAssociatedPhysicalSales(productId: string): Promise<boolean> {
    const result = await db
      .select({ id: schema.physicalSales.id })
      .from(schema.physicalSales)
      .where(eq(schema.physicalSales.product_id, productId))
      .limit(1)

    return result.length > 0
  }

  async delete(id: string, storeId: string): Promise<void> {
    // Verificar se produto existe
    const existingProduct = await this.findById(id, storeId)
    if (!existingProduct) {
      throw new Error('Product not found')
    }

    // Verificar se há pedidos associados
    const hasOrders = await this.hasAssociatedOrders(id)
    if (hasOrders) {
      throw new Error('Cannot delete product: it has associated orders')
    }

    // Verificar se há vendas físicas associadas
    const hasPhysicalSales = await this.hasAssociatedPhysicalSales(id)
    if (hasPhysicalSales) {
      throw new Error('Cannot delete product: it has associated physical sales')
    }

    // Deletar produto (hard delete)
    // Como há CASCADE configurado, vai deletar automaticamente:
    // - product_variants
    // - product_images
    // - product_category
    // - product_seo
    // - product_size_chart
    // - stock_movements
    const result = await db
      .delete(schema.products)
      .where(and(eq(schema.products.id, id), eq(schema.products.store_id, storeId)))
      .returning()

    if (result.length === 0) {
      throw new Error('Product not found')
    }
  }

  async getAvailableSizes(storeId: string): Promise<string[]> {
    // Get all unique sizes from size charts
    const result = await db
      .select({
        size: sql<string>`jsonb_object_keys(${schema.productSizeChart.chart_json})`
      })
      .from(schema.productSizeChart)
      .where(eq(schema.productSizeChart.store_id, storeId))

    // Get unique sizes
    const uniqueSizes = [...new Set(result.map(r => r.size))]
    return uniqueSizes.sort()
  }

  private mapRowToProduct(
    row: ProductRow & {
      main_image?: string | null
      category_name?: string | null
    }
  ): Product {
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
      updated_at: row.updated_at,
      main_image: row.main_image ?? null,
      category_name: row.category_name
    }
  }
}

