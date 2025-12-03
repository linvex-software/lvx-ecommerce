import { z } from 'zod'
import { ProductRepository } from '../../../infra/db/repositories/product-repository'
import type { Product, CreateProductInput } from '../../../domain/catalog/product-types'
import { normalizeSlug } from '../../utils/slug'
import { generateSku } from '../../utils/sku'

const createProductSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/),
  description: z.string().max(5000).optional().nullable(),
  base_price: z.number().positive(),
  sku: z.string().min(1).max(100).optional(),
  status: z.enum(['draft', 'active', 'inactive']).optional(),
  virtual_model_url: z.string().url().optional().nullable(),
  virtual_provider: z.string().max(100).optional().nullable(),
  virtual_config_json: z.record(z.unknown()).optional().nullable(),
  variants: z
    .array(
      z.object({
        sku: z.string().max(100).optional().nullable(),
        size: z.string().max(50).optional().nullable(),
        color: z.string().max(50).optional().nullable(),
        barcode: z.string().max(100).optional().nullable(),
        price_override: z.number().positive().optional().nullable(),
        active: z.boolean().optional()
      })
    )
    .optional(),
  images: z
    .array(
      z.object({
        image_url: z.string().url(),
        position: z.number().int().nonnegative().optional(),
        is_main: z.boolean().optional()
      })
    )
    .optional(),
  category_ids: z.array(z.string().uuid()).optional(),
  seo: z
    .object({
      meta_title: z.string().max(60).optional().nullable(),
      meta_description: z.string().max(160).optional().nullable(),
      meta_keywords: z.string().max(255).optional().nullable(),
      open_graph_image: z.string().url().optional().nullable()
    })
    .optional(),
  size_chart: z
    .object({
      name: z.string().min(1).max(255),
      chart_json: z.record(z.unknown())
    })
    .optional()
})

export interface CreateProductDependencies {
  productRepository: ProductRepository
}

export async function createProductUseCase(
  input: z.infer<typeof createProductSchema>,
  storeId: string,
  dependencies: CreateProductDependencies
): Promise<Product> {
  const { productRepository } = dependencies

  const validated = createProductSchema.parse(input)

  // Normalizar slug
  const normalizedSlug = normalizeSlug(validated.slug)

  // Verificar se slug já existe (usando query direta)
  const existingBySlug = await productRepository.findByStoreAndSlug(storeId, normalizedSlug)
  if (existingBySlug) {
    throw new Error('Product slug already exists for this store')
  }

  // Gerar SKU automático se vazio
  let finalSku = validated.sku?.trim() || ''
  if (!finalSku) {
    let attempts = 0
    const maxAttempts = 5
    do {
      finalSku = generateSku(storeId)
      attempts++
      const existingBySku = await productRepository.findByStoreAndSku(storeId, finalSku)
      if (!existingBySku) {
        break
      }
      if (attempts >= maxAttempts) {
        throw new Error('Failed to generate unique SKU after multiple attempts')
      }
    } while (attempts < maxAttempts)
  } else {
    // Verificar se SKU já existe (usando query direta)
    const existingBySku = await productRepository.findByStoreAndSku(storeId, finalSku)
    if (existingBySku) {
      throw new Error('Product SKU already exists for this store')
    }
  }

  const createInput: CreateProductInput = {
    store_id: storeId,
    name: validated.name,
    slug: normalizedSlug,
    description: validated.description ?? null,
    base_price: validated.base_price,
    sku: finalSku,
    status: validated.status ?? 'draft',
    virtual_model_url: validated.virtual_model_url ?? null,
    virtual_provider: validated.virtual_provider ?? null,
    virtual_config_json: validated.virtual_config_json ?? null,
    variants: validated.variants,
    images: validated.images,
    category_ids: validated.category_ids,
    seo: validated.seo,
    size_chart: validated.size_chart
  }

  return await productRepository.create(createInput)
}

export { createProductSchema }

