import { db, schema } from '@white-label/db'
import { eq, and, desc, inArray } from 'drizzle-orm'

export interface ProductReview {
  id: string
  store_id: string
  product_id: string
  order_item_id: string
  customer_id: string | null
  rating: number
  is_hidden: boolean
  created_at: Date
  updated_at: Date
}

export interface ReviewTag {
  id: string
  store_id: string
  review_id: string
  tag: string
  rating: number
}

export interface ReviewWithTags extends ProductReview {
  tags: ReviewTag[]
}

export interface ReviewSummary {
  average_rating: number
  total_reviews: number
  rating_breakdown: {
    rating: number
    count: number
  }[]
  top_tags: {
    tag: string
    count: number
    rating: number
  }[]
}

export class ReviewRepository {
  async create(data: {
    store_id: string
    product_id: string
    order_item_id: string
    customer_id: string | null
    rating: number
    tags?: string[]
  }): Promise<ReviewWithTags> {
    // Criar review
    const [review] = await db
      .insert(schema.productReviews)
      .values({
        store_id: data.store_id,
        product_id: data.product_id,
        order_item_id: data.order_item_id,
        customer_id: data.customer_id,
        rating: data.rating
      })
      .returning()

    // Criar tags se houver
    const tags: ReviewTag[] = []
    if (data.tags && data.tags.length > 0) {
      const tagsToInsert = data.tags.map((tag) => ({
        store_id: data.store_id,
        review_id: review.id,
        tag,
        rating: data.rating
      }))

      const insertedTags = await db
        .insert(schema.reviewTags)
        .values(tagsToInsert)
        .returning()

      tags.push(...insertedTags)
    }

    return {
      id: review.id,
      store_id: review.store_id,
      product_id: review.product_id,
      order_item_id: review.order_item_id,
      customer_id: review.customer_id,
      rating: review.rating,
      is_hidden: review.is_hidden,
      created_at: review.created_at,
      updated_at: review.updated_at,
      tags
    }
  }

  async findByOrderItem(orderItemId: string): Promise<ProductReview | null> {
    const [result] = await db
      .select()
      .from(schema.productReviews)
      .where(eq(schema.productReviews.order_item_id, orderItemId))
      .limit(1)

    return result || null
  }

  async getSummary(productId: string, storeId: string): Promise<ReviewSummary> {
    // Buscar reviews não ocultos com IDs para buscar tags depois
    const reviews = await db
      .select({
        id: schema.productReviews.id,
        rating: schema.productReviews.rating
      })
      .from(schema.productReviews)
      .where(
        and(
          eq(schema.productReviews.product_id, productId),
          eq(schema.productReviews.store_id, storeId),
          eq(schema.productReviews.is_hidden, false)
        )
      )

    const totalReviews = reviews.length

    if (totalReviews === 0) {
      return {
        average_rating: 0,
        total_reviews: 0,
        rating_breakdown: [],
        top_tags: []
      }
    }

    // Calcular média
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0)
    const average_rating = sum / totalReviews

    // Rating breakdown
    const breakdownMap = new Map<number, number>()
    for (const review of reviews) {
      breakdownMap.set(review.rating, (breakdownMap.get(review.rating) || 0) + 1)
    }

    const rating_breakdown = Array.from(breakdownMap.entries())
      .map(([rating, count]) => ({ rating, count }))
      .sort((a, b) => b.rating - a.rating)

    // Top tags (buscar tags das reviews já obtidas)
    const reviewIdsList = reviews.map((r) => r.id)
    const tags = reviewIdsList.length > 0
      ? await db
          .select({
            tag: schema.reviewTags.tag,
            rating: schema.reviewTags.rating
          })
          .from(schema.reviewTags)
          .where(inArray(schema.reviewTags.review_id, reviewIdsList))
      : []

    // Contar tags
    const tagMap = new Map<string, { count: number; rating: number }>()
    for (const tag of tags) {
      const existing = tagMap.get(tag.tag)
      if (existing) {
        existing.count++
      } else {
        tagMap.set(tag.tag, { count: 1, rating: tag.rating })
      }
    }

    const top_tags = Array.from(tagMap.entries())
      .map(([tag, data]) => ({
        tag,
        count: data.count,
        rating: data.rating
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10) // Top 10

    return {
      average_rating,
      total_reviews: totalReviews,
      rating_breakdown,
      top_tags
    }
  }

  async listByProduct(
    productId: string,
    storeId: string,
    limit: number = 50
  ): Promise<ReviewWithTags[]> {
    const reviews = await db
      .select()
      .from(schema.productReviews)
      .where(
        and(
          eq(schema.productReviews.product_id, productId),
          eq(schema.productReviews.store_id, storeId),
          eq(schema.productReviews.is_hidden, false)
        )
      )
      .orderBy(desc(schema.productReviews.created_at))
      .limit(limit)

    if (reviews.length === 0) {
      return []
    }

    // Buscar tags para todas as reviews
    const reviewIds = reviews.map((r) => r.id)
    const tags = reviewIds.length > 0
      ? await db
          .select()
          .from(schema.reviewTags)
          .where(inArray(schema.reviewTags.review_id, reviewIds))
      : []

    // Agrupar tags por review
    const tagsByReview = new Map<string, ReviewTag[]>()
    for (const tag of tags) {
      const existing = tagsByReview.get(tag.review_id) || []
      existing.push(tag)
      tagsByReview.set(tag.review_id, existing)
    }

    return reviews.map((review) => ({
      id: review.id,
      store_id: review.store_id,
      product_id: review.product_id,
      order_item_id: review.order_item_id,
      customer_id: review.customer_id,
      rating: review.rating,
      is_hidden: review.is_hidden,
      created_at: review.created_at,
      updated_at: review.updated_at,
      tags: tagsByReview.get(review.id) || []
    }))
  }

  async updateHidden(id: string, storeId: string, isHidden: boolean): Promise<void> {
    await db
      .update(schema.productReviews)
      .set({
        is_hidden: isHidden,
        updated_at: new Date()
      })
      .where(
        and(
          eq(schema.productReviews.id, id),
          eq(schema.productReviews.store_id, storeId)
        )
      )
  }

  async hasReviewForOrderItem(orderItemId: string): Promise<boolean> {
    const [result] = await db
      .select({ id: schema.productReviews.id })
      .from(schema.productReviews)
      .where(eq(schema.productReviews.order_item_id, orderItemId))
      .limit(1)

    return !!result
  }

  async canCustomerReview(
    customerId: string,
    productId: string,
    storeId: string
  ): Promise<{ canReview: boolean; orderItemId?: string }> {
    // Buscar order_item do cliente que comprou este produto
    const orderItem = await db
      .select({
        id: schema.orderItems.id,
        order_id: schema.orderItems.order_id
      })
      .from(schema.orderItems)
      .innerJoin(schema.orders, eq(schema.orderItems.order_id, schema.orders.id))
      .where(
        and(
          eq(schema.orderItems.product_id, productId),
          eq(schema.orders.store_id, storeId),
          eq(schema.orders.customer_id, customerId),
          eq(schema.orders.payment_status, 'paid')
        )
      )
      .limit(1)

    if (orderItem.length === 0) {
      return { canReview: false }
    }

    const itemId = orderItem[0].id

    // Verificar se já tem review para este order_item
    const hasReview = await this.hasReviewForOrderItem(itemId)

    if (hasReview) {
      return { canReview: false }
    }

    return { canReview: true, orderItemId: itemId }
  }
}

