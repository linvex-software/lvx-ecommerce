export type WebhookStatus = 'received' | 'processed' | 'failed'

export interface WebhookEvent {
  id: string
  store_id: string
  provider: string
  event_type: string | null
  payload: Record<string, unknown>
  signature_valid: boolean
  status: WebhookStatus
  attempts: number
  last_attempt_at: Date | null
  error_message: string | null
  created_at: Date
}

export interface CreateWebhookEventInput {
  storeId: string
  provider: string
  eventType?: string | null
  payload: Record<string, unknown>
  signatureValid: boolean
}

export interface UpdateWebhookProcessingInput {
  id: string
  status: WebhookStatus
  attempts: number
  errorMessage?: string | null
}

