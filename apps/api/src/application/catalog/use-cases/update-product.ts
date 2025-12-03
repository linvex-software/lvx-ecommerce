import { z } from 'zod'
import { ProductRepository } from '../../../infra/db/repositories/product-repository'
import type { Product, UpdateProductInput } from '../../../domain/catalog/product-types'
import { normalizeSlug } from '../../utils/slug'

const updateProductSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().max(5000).optional().nullable(),
  base_price: z.number().positive().optional(),
  sku: z.string().min(1).max(100).optional(),
  status: z.enum(['draft', 'active', 'inactive']).optional(),
  virtual_model_url: z.string().url().optional().nullable(),
  virtual_provider: z.string().max(100).optional().nullable(),
  virtual_config_json: z.record(z.unknown()).optional().nullable(),
  variants: z
    .array(
      z.object({
        id: z.string().uuid().optional(),
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
        id: z.string().uuid().optional(),
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

export interface UpdateProductDependencies {
  productRepository: ProductRepository
}

export async function updateProductUseCase(
  id: string,
  storeId: string,
  input: z.infer<typeof updateProductSchema>,
  dependencies: UpdateProductDependencies
): Promise<Product> {
  const { productRepository } = dependencies

  const validated = updateProductSchema.parse(input)

  // Verificar se produto existe
  const existingProduct = await productRepository.findById(id, storeId)
  if (!existingProduct) {
    throw new Error('Product not found')
  }

  // Normalizar slug se estiver sendo alterado
  let finalSlug = validated.slug
  if (validated.slug && validated.slug !== existingProduct.slug) {
    finalSlug = normalizeSlug(validated.slug)
    
    // Verificar se slug já existe em outro produto (usando query direta)
    const existingBySlug = await productRepository.findByStoreAndSlug(storeId, finalSlug)
    if (existingBySlug && existingBySlug.id !== id) {
      throw new Error('Product slug already exists for this store')
    }
  } else if (validated.slug) {
    finalSlug = normalizeSlug(validated.slug)
  }

  // Verificar se SKU já existe em outro produto (se estiver sendo alterado)
  if (validated.sku && validated.sku !== existingProduct.sku) {
    const existingBySku = await productRepository.findByStoreAndSku(storeId, validated.sku)
    if (existingBySku && existingBySku.id !== id) {
      throw new Error('Product SKU already exists for this store')
    }
  }

  const updateInput: UpdateProductInput = {
    name: validated.name,
    slug: finalSlug,
    description: validated.description,
    base_price: validated.base_price,
    sku: validated.sku,
    status: validated.status,
    virtual_model_url: validated.virtual_model_url,
    virtual_provider: validated.virtual_provider,
    virtual_config_json: validated.virtual_config_json,
    variants: validated.variants,
    images: validated.images,
    category_ids: validated.category_ids,
    seo: validated.seo,
    size_chart: validated.size_chart
  }

  return await productRepository.update(id, storeId, updateInput)
}

export { updateProductSchema }

