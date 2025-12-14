import { db, schema } from '@white-label/db'
import { eq, and, desc, sql } from 'drizzle-orm'
import type {
  CustomerFavorite,
  CustomerFavoriteWithProduct
} from '../../../domain/favorites/favorite-types'

export class FavoriteRepository {
  /**
   * Criar um novo favorito
   */
  async create(
    storeId: string,
    customerId: string,
    productId: string
  ): Promise<CustomerFavorite> {
    const [result] = await db
      .insert(schema.customerFavorites)
      .values({
        store_id: storeId,
        customer_id: customerId,
        product_id: productId
      })
      .returning()

    return {
      id: result.id,
      store_id: result.store_id,
      customer_id: result.customer_id,
      product_id: result.product_id,
      created_at: result.created_at
    }
  }

  /**
   * Remover um favorito
   */
  async delete(
    storeId: string,
    customerId: string,
    productId: string
  ): Promise<void> {
    await db
      .delete(schema.customerFavorites)
      .where(
        and(
          eq(schema.customerFavorites.store_id, storeId),
          eq(schema.customerFavorites.customer_id, customerId),
          eq(schema.customerFavorites.product_id, productId)
        )
      )
  }

  /**
   * Buscar todos os favoritos de um cliente com detalhes do produto
   */
  async findByCustomer(
    storeId: string,
    customerId: string
  ): Promise<CustomerFavoriteWithProduct[]> {
    const results = await db
      .select({
        id: schema.customerFavorites.id,
        store_id: schema.customerFavorites.store_id,
        customer_id: schema.customerFavorites.customer_id,
        product_id: schema.customerFavorites.product_id,
        created_at: schema.customerFavorites.created_at,
        product: {
          id: schema.products.id,
          name: schema.products.name,
          slug: schema.products.slug,
          base_price: schema.products.base_price,
          status: schema.products.status
        }
      })
      .from(schema.customerFavorites)
      .innerJoin(
        schema.products,
        eq(schema.customerFavorites.product_id, schema.products.id)
      )
      .where(
        and(
          eq(schema.customerFavorites.store_id, storeId),
          eq(schema.customerFavorites.customer_id, customerId),
          eq(schema.products.status, 'active') // Apenas produtos ativos
        )
      )
      .orderBy(desc(schema.customerFavorites.created_at))

    // Buscar imagem principal de cada produto
    const favoritesWithImages = await Promise.all(
      results.map(async (favorite) => {
        const mainImage = await db
          .select({
            image_url: schema.productImages.image_url
          })
          .from(schema.productImages)
          .where(
            and(
              eq(schema.productImages.product_id, favorite.product.id),
              eq(schema.productImages.is_main, true)
            )
          )
          .limit(1)

        return {
          id: favorite.id,
          store_id: favorite.store_id,
          customer_id: favorite.customer_id,
          product_id: favorite.product_id,
          created_at: favorite.created_at,
          product: {
            id: favorite.product.id,
            name: favorite.product.name,
            slug: favorite.product.slug,
            base_price: String(favorite.product.base_price || '0'),
            main_image: mainImage[0]?.image_url || null,
            status: String(favorite.product.status)
          }
        }
      })
    )

    return favoritesWithImages
  }

  /**
   * Verificar se um produto está favoritado por um cliente
   */
  async checkIfFavorite(
    storeId: string,
    customerId: string,
    productId: string
  ): Promise<boolean> {
    const result = await db
      .select({ id: schema.customerFavorites.id })
      .from(schema.customerFavorites)
      .where(
        and(
          eq(schema.customerFavorites.store_id, storeId),
          eq(schema.customerFavorites.customer_id, customerId),
          eq(schema.customerFavorites.product_id, productId)
        )
      )
      .limit(1)

    return result.length > 0
  }

  /**
   * Contar favoritos de um cliente (apenas produtos ativos)
   */
  async countByCustomer(
    storeId: string,
    customerId: string
  ): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)`.as('count') })
      .from(schema.customerFavorites)
      .innerJoin(
        schema.products,
        eq(schema.customerFavorites.product_id, schema.products.id)
      )
      .where(
        and(
          eq(schema.customerFavorites.store_id, storeId),
          eq(schema.customerFavorites.customer_id, customerId),
          eq(schema.products.status, 'active')
        )
      )

    return Number(result[0]?.count || 0)
  }
}

