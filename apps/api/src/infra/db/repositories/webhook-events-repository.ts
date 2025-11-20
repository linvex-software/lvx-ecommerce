import { db, schema } from '@white-label/db'
import { eq, and } from 'drizzle-orm'
import type {
  WebhookEvent,
  CreateWebhookEventInput,
  UpdateWebhookProcessingInput,
  WebhookStatus
} from '../../../domain/webhooks/webhook-types'

export class WebhookEventsRepository {
  async create(data: CreateWebhookEventInput): Promise<WebhookEvent> {
    const result = await db
      .insert(schema.webhookEvents)
      .values({
        store_id: data.storeId,
        provider: data.provider,
        event_type: data.eventType ?? null,
        payload: data.payload,
        signature_valid: data.signatureValid,
        status: 'received',
        attempts: 0
      })
      .returning()

    const row = result[0]
    return {
      id: row.id,
      store_id: row.store_id,
      provider: row.provider,
      event_type: row.event_type,
      payload: row.payload as Record<string, unknown>,
      signature_valid: row.signature_valid,
      status: row.status as WebhookStatus,
      attempts: row.attempts,
      last_attempt_at: row.last_attempt_at,
      error_message: row.error_message,
      created_at: row.created_at
    }
  }

  async markAsProcessed(id: string, storeId: string): Promise<void> {
    await db
      .update(schema.webhookEvents)
      .set({
        status: 'processed',
        last_attempt_at: new Date()
      })
      .where(
        and(
          eq(schema.webhookEvents.id, id),
          eq(schema.webhookEvents.store_id, storeId)
        )
      )
  }

  async markAsFailed(
    id: string,
    storeId: string,
    errorMessage?: string | null
  ): Promise<void> {
    const event = await this.findById(id, storeId)
    if (!event) {
      throw new Error('Webhook event not found')
    }

    await db
      .update(schema.webhookEvents)
      .set({
        status: 'failed',
        attempts: event.attempts + 1,
        last_attempt_at: new Date(),
        error_message: errorMessage ?? null
      })
      .where(
        and(
          eq(schema.webhookEvents.id, id),
          eq(schema.webhookEvents.store_id, storeId)
        )
      )
  }

  async incrementAttempts(id: string, storeId: string): Promise<void> {
    const event = await this.findById(id, storeId)
    if (!event) {
      throw new Error('Webhook event not found')
    }

    await db
      .update(schema.webhookEvents)
      .set({
        attempts: event.attempts + 1,
        last_attempt_at: new Date()
      })
      .where(
        and(
          eq(schema.webhookEvents.id, id),
          eq(schema.webhookEvents.store_id, storeId)
        )
      )
  }

  async findById(id: string, storeId: string): Promise<WebhookEvent | null> {
    const result = await db
      .select()
      .from(schema.webhookEvents)
      .where(
        and(
          eq(schema.webhookEvents.id, id),
          eq(schema.webhookEvents.store_id, storeId)
        )
      )
      .limit(1)

    if (result.length === 0) {
      return null
    }

    const row = result[0]
    return {
      id: row.id,
      store_id: row.store_id,
      provider: row.provider,
      event_type: row.event_type,
      payload: row.payload as Record<string, unknown>,
      signature_valid: row.signature_valid,
      status: row.status as WebhookStatus,
      attempts: row.attempts,
      last_attempt_at: row.last_attempt_at,
      error_message: row.error_message,
      created_at: row.created_at
    }
  }

  async listFailedByProvider(
    storeId: string,
    provider: string
  ): Promise<WebhookEvent[]> {
    const result = await db
      .select()
      .from(schema.webhookEvents)
      .where(
        and(
          eq(schema.webhookEvents.store_id, storeId),
          eq(schema.webhookEvents.provider, provider),
          eq(schema.webhookEvents.status, 'failed')
        )
      )

    return result.map((row) => ({
      id: row.id,
      store_id: row.store_id,
      provider: row.provider,
      event_type: row.event_type,
      payload: row.payload as Record<string, unknown>,
      signature_valid: row.signature_valid,
      status: row.status as WebhookStatus,
      attempts: row.attempts,
      last_attempt_at: row.last_attempt_at,
      error_message: row.error_message,
      created_at: row.created_at
    }))
  }
}

